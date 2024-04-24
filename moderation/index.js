const express = require('express');
const body_parser = require('body-parser');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(body_parser.json());
app.use(cors());

//  this server just watches for events
//  whenever it receives an event, it will forward it to the other services

app.post('/events', async (req, resp) => {

    const { type, data } = req.body;

    if(type ===  'comment_created'){
        const status = data.content.includes('orange') ? 'rejected' : 'approved';
        await axios.post(`http://localhost:4005/events`, {
            type: 'comment_moderated',
            data:{
                id : data.id,
                post_id : data.post_id,
                status : status,
                content : data.content,
            }
        }).catch((err) => { console.log(err.message); });
    }

    resp.send({}); // send back an empty object
});

app.listen(4003, () => {
    console.log('Listening on 4003');
});