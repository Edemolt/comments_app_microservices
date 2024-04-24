const express = require('express');
const body_parser = require('body-parser');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(body_parser.json());
app.use(cors());

const posts = {};

const handle_event = (type, data) => {
    if( type === 'post_created'){
        const { id, title } = data;
        posts[id] = { id, title, comments: [] };
    }
    if( type === 'comment_created'){
        const { id, content, post_id, status } = data;
        const post = posts[post_id];
        if (post) {
            post.comments.push({ id, content, status });
        } else {
            console.error(`Post with ID ${post_id} not found`);
        }
    }

    if( type === 'comment_updated'){
        const { id, content, post_id, status } = data;

        const post = posts[post_id];
        // find the appropriate commnet
        const comment = post.comments.find( comment => {
            return comment.id === id;
        });
        // update the content and status of the comment
        comment.status = status;
        comment.content = content;
    }
}

app.get('/posts',(req, resp) => {
    resp.send(posts);
});

app.post('/events', (req, resp) => {
    const { type, data } = req.body; 

    handle_event(type, data);

    resp.send({});
});

app.listen(4002, async ()=>{
    console.log('Listening on 4002')
    
    try{
        const resp = await axios.get('http://localhost:4005/events')

        for(let event of resp.data){
            console.log('Processing event:', event.type);
            handle_event(event.type, event.data);
        }
    }catch(err){
        console.log(err.message);
    };
})