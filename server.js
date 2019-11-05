const express = require('express');
const app = express();

const json2html = require('json-to-html');

const {Datastore} = require('@google-cloud/datastore');
const bodyParser = require('body-parser');

const projectId = 'hw5-rest-liuqib';
const datastore = new Datastore({projectId:projectId});

const BOAT = "Boat";

const router = express.Router();

app.use(bodyParser.json());

function fromDatastore(item){
    item.id = item[Datastore.KEY].id;
    return item;
}

/* ------------- Begin boat Model Functions ------------- */
function post_boat(name, type, length){                                                   //add Boat
  var key = datastore.key(BOAT);
	const new_boat = {"name": name, "type": type, "length": length};
	return datastore.save({"key":key, "data":new_boat}).then(() => {return key});
}

function get_boats(req){                                                              //view all boats
	const q = datastore.createQuery(BOAT);
	return datastore.runQuery(q).then( (results) => {
    var resultingBoats = results[0].map(fromDatastore);
    var i;
    for (i = 0; i < resultingBoats.length; i++) {
      resultingBoats[i].self = req.protocol + "://" + req.get('host') + req.baseUrl + '/' + resultingBoats[i].id;         //need change
    }
    return resultingBoats;
		});
}

function get_that_boat(boatID){                                                              //view specified boat
    const key = datastore.key([BOAT, parseInt(boatID,10)]);
    const boatQuery = datastore.createQuery(BOAT).filter('__key__', '=', key);
    return datastore.runQuery(boatQuery).then(results => {
      var resultingBoat = results[0].map(fromDatastore);
      if(resultingBoat[0] != null){
        resultingBoat[0].self = "http://localhost:8080/boats/" + boatID;     //needed change
	      return resultingBoat[0];
      }
      else {
        return null;
      }
    });
}

function patch_boat(id, name, type, length){                                                  //edit boat
    const key = datastore.key([BOAT, parseInt(id,10)]);
    const updated_boat = {"name": name, "type": type, "length": length};
    return datastore.save({"key":key, "data":updated_boat}).then(() => {return key});
}

function put_boat(id, name, description, price){
    const key = datastore.key([boat, parseInt(id,10)]);
    const boat = {"name": name, "description": description, "price": price};
    return datastore.save({"key":key, "data":boat});
}

function delete_boat(id){                                                          //delete boat
    const key = datastore.key([BOAT, parseInt(id,10)]);
    return datastore.delete(key);
}

/* ------------- End Model Functions ------------- */

/* ------------- Begin Controller Functions ------------- */

router.get('/', function(req, res){
    const boats = get_boats(req)
	.then( (boats) => {
        res.status(200).json(boats);
    });
});

router.get('/:id', function(req, res){
    const boats = get_that_boat(req.params.id)
	.then( (boat) => {
        const accepts = req.accepts(['application/json', 'text/html']);
        if(!accepts){
            res.status(406).send('Not Acceptable');
        } else if(accepts === 'application/json'){
            res.status(200).json(boat);
        } else if(accepts === 'text/html'){
            res.status(200).send(json2html(boat).slice(1,-1));
        } else { res.status(500).send('Content type got messed up!'); }
    });
});


router.post('/', function(req, res){
  // if (req.body.name && req.body.type && req.body.length) {
    if(req.get('content-type') !== 'application/json'){
        res.status(415).send('Server only accepts application/json data.')
    }
    else{
      post_boat(req.body.name, req.body.type, req.body.length)
      .then( key => {
          res.location(req.protocol + "://" + req.get('host') + req.baseUrl + '/' + key.id);
          res.set("Content", "application/json");
          res.status(201).send('{ "id": ' + key.id + ', "name": "' + req.body.name + '", "type": "' + req.body.type + '", "length": ' + req.body.length + ', "self": "' + req.protocol + "://" + req.get('host') + req.baseUrl + '/'  + key.id +'"}')
      });
    }
  // }
  // else{
  //   res.status(400).send({ Error: "The request object is missing at least one of the required attributes"});
  // }
});

router.patch('/:id', function(req, res){                                        //patch boat
  if(req.get('content-type') !== 'application/json'){
      res.status(415).send(Error: "Server only accepts application/json data.");
  }
  else{
    const boat = get_that_boat(req.params.id)
  	.then( (boat) => {
        if(boat != null){
          console(req);
          patch_boat(req.params.id, req.body.name, req.body.type, req.body.length)
          .then( key => {
            res.status(200).send('{ "id": ' + key.id + ', "name": "' + req.body.name + '", "type": "' + req.body.type + '", "length": ' + req.body.length + ', "self": "' + "https://hw3-datastore-liuqib.appspot.com/boats/" + key.id +'"}')
          });
        }
        else{
          res.status(404).send({ Error: "No boat with this boat_id exists"});
        }
      });
  }
});

router.delete('/', function (req, res){
    res.set('Accept', 'GET, POST');
    res.status(405).send("Not Acceptable");
});

router.put('/', function (req, res){
    res.set('Accept', 'GET, POST');
    res.status(405).send("Not Acceptable");
});

router.post('/:id', function (req, res){
    res.set('Accept', 'PUT, PATCH, DELETE');
    res.status(405).send("Not Acceptable");
});

router.put('/:id', function(req, res){
    put_boat(req.params.id, req.body.name, req.body.description, req.body.price)
    .then(res.status(200).end());
});

// router.delete('/:id', function(req, res){
//     delete_boat(req.params.id).then(res.status(204).end())
// });

router.delete('/:id', function(req, res){                                            //delete boat
  get_that_boat(req.params.id).then((result) => {
  if(result == null){
    res.status(404).send({ Error: "No boat with this boat_id exists"});
  }
  else{
     delete_boat(req.params.id).then(res.status(204).end());
  }
    });
});

/* ------------- End Controller Functions ------------- */

app.use('/boats', router);

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});
