const express = require('express');
const body_parser = require('body-parser');
const { randomBytes } = require('crypto');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(body_parser.json());
app.use(cors());

const posts = {};

app.get('/posts', ( req, resp) => {
    resp.send(posts);
});

app.post('/posts', async ( req, resp) => {
    const id = randomBytes(4).toString('hex');
    const { title } = req.body;

    posts[id] = {
        id, title
    };

    await axios.post('http://event-bus-srv:4005/events', {
        "type" : "post_created",
        "data" : {
            id, title
        },
    });

    resp.status(201).send(posts[id]);
});

app.post('/events', ( req, resp ) => {
    console.log('Received Event posts', req.body.type);
    resp.send({}); // send back an empty object
});  
 


app.listen(4000, () => {
    console.log('v55');
    console.log('Listening on 4000');
});