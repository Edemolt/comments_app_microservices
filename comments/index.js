const express = require('express');
const body_parser = require('body-parser');
const { randomBytes } = require('crypto');
const cors = require('cors');
const axios = require('axios');
const { stat } = require('fs');


const app = express();

app.use(body_parser.json());
app.use(cors());

const comments_by_post_id = {};

app.get('/posts/:id/comments', ( req, resp) => {
    resp.send(comments_by_post_id[req.params.id] || []);
});

app.post('/posts/:id/comments', async ( req, resp) => {
    const comment_id = randomBytes(4).toString('hex'); // randomly generate a comment id
    const { content } = req.body;
    const comments = comments_by_post_id[ req.params.id ] || []; // either an array or undifeined.. if undefined, use empty array

    // add the new comment to the array
    comments.push({ id: comment_id, content, status: 'pending'});
    // update the comments_by_post_id object
    comments_by_post_id[req.params.id] = comments;

    // emit an event to the event bus
    await axios.post('http://event-bus-srv:4005/events', {
        type: 'comment_created',
        data: {
            id: comment_id, // the comment id
            content : content, // the content of the comment
            post_id: req.params.id, // the post id
            status: 'pending', // the status of the comment

        }
    });

    // send the new comment back to the client and the entire array of comments
    resp.status(201).send(comments);
});

app.post('/events', async ( req, resp ) => {
    console.log('Received Event comments', req.body.type);

    const { type, data } = req.body;   

    if( type === 'comment_moderated'){
        const {post_id, id, status, content} = data;
        const comments = comments_by_post_id[post_id];
        // iterate over the comments array and find the comment we want to update

        const comment = comments.find( comment => {
            return comment.id === id;
        })

        // update the status of the comment
        comment.status = status;    
        // now tell every other service that this event has occured

        await axios.post(`http://event-bus-srv:4005/events`, {
            type : `comment_updated`,
            data:{
                id : id,
                status : status,
                post_id : post_id,
                content : content,
            }
        });
    }

    resp.send({}); // send back an empty object
});  

app.listen(4001, () => {
    console.log('Listening on 4001');
});