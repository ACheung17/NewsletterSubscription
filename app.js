const bodyParser = require("body-parser");
const express = require("express");
const request = require("request");
const https = require("https");
const crypto = require("crypto");

const app = express();

app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static("public"))

app.get("/", function(req, res){
    res.sendFile(__dirname + "/signup.html");
});

app.post("/", function(req, res){
    const firstName = req.body.inputFirstName;
    const lastName = req.body.inputLastName;
    const email = req.body.inputEmail;
    
    //create JS objects for mailchimp
    const data = {
        members: [
            {
                email_address: email,
                status: "subscribed",
                merge_fields: {
                    FNAME: firstName,
                    LNAME: lastName
                }
            }
        ]
    };
    //parse the JS object to JSON so that mailchimp can read it 
    const jsonData = JSON.stringify(data);

    //mailchimp server's url, substitute X for the 1/2 digits after "...us" in your APIkey
    const url = "https://usX.api.mailchimp.com/3.0/lists/{list_id}";

    //for authentication
    const options = {
        method: "POST",
        auth: "anystring:<your_apikey>"
    }
    //saving it into a const to send an https request to the mailchimp servers
    const request = https.request(url, options, function(response){
        if(response.statusCode === 200){
            res.sendFile(__dirname + "/success.html");
        }
        else{
            res.sendFile(__dirname + "/failure.html");
        }
        //response from the mailchimp servers called "data"
        response.on("data", function(data){
            //parse the data sent back from mailchimp so its more readable
           console.log(JSON.parse(data)); 
        });
    });
    //sending the data to mailchimp
    request.write(jsonData);
    //end with sending data
    request.end();
});
//failed to subscribe
app.post("/failure", function(req, res){
    res.redirect("/");
});

//failed to unsubscribe
app.post("/failToUnsub", function(req, res){
    res.sendFile(__dirname + "/unsubscribe.html");
});

//the unsub button @ home page
app.post("/unsubscribe", function(req, res){
    res.sendFile(__dirname + "/unsubscribe.html");
});

//for unsubscribe button @ unsubscribe.html     
app.post("/unsubscribed", function(req, res){
    const email = req.body.inputEmail;
    const unsubData = {
        status: "unsubscribed"
    }
    const jsonUnsubData = JSON.stringify(unsubData);
    console.log(jsonUnsubData);
    
    //requires md5 hash
    const hash = crypto.createHash("md5").update(email).digest("hex");
    console.log(hash);
    
    const url = "https://usX.api.mailchimp.com/3.0/lists/{list_id}/members/" + hash;
    //to permanently delete list member use this url instead.
    //const url = "https://usX.api.mailchimp.com/3.0/lists/{list_id}/members/" + hash + "/actions/delete-permanent";

    const options = {
        method: "PATCH",
        auth: "anystring:<your_apikey>"
    }

    const request = https.request(url, options, function(response){
        if(response.statusCode === 200){
            res.sendFile(__dirname + "/successUnsub.html");
        }
        else if (response.statusCode === 404){
            res.sendFile(__dirname + "/failToUnsub.html")
        }
        else{
            res.sendFile(__dirname + "/failure.html");
        }
        response.on("data", function(data){
            console.log(JSON.parse(data));
        })
    });
    request.write(jsonUnsubData);
    request.end();
});

app.listen(process.env.PORT || 3000, function(){
    console.log("Server running on port 3000.");
});