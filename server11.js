const express = require('express');
const app = express();

const {Datastore} = require('@google-cloud/datastore');
const bodyParser = require('body-parser');

const datastore = new Datastore();

const BOAT = "Boat";

const router = express.Router();

app.use(bodyParser.json());

function fromDatastore(item){
    item.id = item[Datastore.KEY].id;
    return item;
}

/* ------------- Begin Lodging Model Functions ------------- */
function post_boat(name, type, length){                                                   //add Boat
  var key = datastore.key(BOAT);
	const new_boat = {"name": name, "type": type, "length": length};
	return datastore.save({"key":key, "data":new_boat}).then(() => {return key});
}

function get_boats(){                                                              //view all boats
	const q = datastore.createQuery(BOAT);
	return datastore.runQuery(q).then( (results) => {
    var resultingBoats = results[0].map(fromDatastore);
    var i;
    for (i = 0; i < resultingBoats.length; i++) {
      resultingBoats[i].self = "http://https://hw3-datastore-liuqib.appspot.com/boats/" + resultingBoats[i].id;         //need change
    }
    return resultingBoats;
		});
}

function get_that_boat(boatID){                                                              //view specified boat
    const key = datastore.key([BOAT, parseInt(boatID,10)]);
    const boatQuery = datastore.createQuery(BOAT).filter('__key__', '=', key);
    return datastore.runQuery(boatQuery).then(results => {
      // console.log(results[0].map(fromDatastore));
      var resultingBoat = results[0].map(fromDatastore);
      if(resultingBoat[0] != null){
        resultingBoat[0].self = "https://hw3-datastore-liuqib.appspot.com/boats/" + boatID;                   //needed change
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


function delete_boat(id){                                                          //delete boat
    const key = datastore.key([BOAT, parseInt(id,10)]);
    return datastore.delete(key);
}

/* ---------------------------------------------------------SLIP function section-----------------------------------------------------------------------*/
function post_slip(number){                                                   //add slip
  var key = datastore.key(SLIP);
	const new_slip = {"number": number, "current_boat": null};
	return datastore.save({"key":key, "data":new_slip}).then(() => {return key});
}

function get_slips(){                                                              //view all slips
	const q = datastore.createQuery(SLIP);
	return datastore.runQuery(q).then( (results) => {
    var resultingSlips = results[0].map(fromDatastore);
    var i;
    for (i = 0; i < resultingSlips.length; i++) {
      resultingSlips[i].self = "https://hw3-datastore-liuqib.appspot.com/slips/" + resultingSlips[i].id;         //need change
    }
    return resultingSlips;
		});
}

function get_that_slip(slipID){                                                              //view specified slip
    const key = datastore.key([SLIP, parseInt(slipID,10)]);

        const slipQuery = datastore.createQuery(SLIP).filter('__key__', '=', key);
        return datastore.runQuery(slipQuery).then(results => {
        var resultingSlip = results[0].map(fromDatastore);
        if(resultingSlip[0] != null){
          resultingSlip[0].self = "https://hw3-datastore-liuqib.appspot.com/slips/" + slipID;                   //needed change
    	    return resultingSlip[0];
        }
          else {
            return null;
          }
        });
}

function boatArriveSlip (slipID, boatID) {                                                  //boat arrival function
    const key = datastore.key([SLIP, parseInt(slipID,10)]);
    return datastore.get(key).then(results => {
	     var boatArrive = {
	        "number": results[0].number,
	        "current_boat": Number(boatID),
	     };
	     const updatedSlip = {
	        key: key,
	        data: boatArrive
	     };
	     return datastore.update(updatedSlip).then(() => {
	        return get_that_slip(slipID); ///////////////////
	     });
    });
}

function boatDepartureSlip(slipID, boatID) {                                                //boat depature function
    const key = datastore.key([SLIP, parseInt(slipID,10)]);
    return datastore.get(key).then(results => {
      // console.log(typeof boatID);
      var boatDeparture = {
        "number": results[0].number,
        "current_boat": null,
     };
     const updatedSlip = {
        key: key,
        data: boatDeparture
     };
     return datastore.update(updatedSlip).then(() => {
        return get_that_slip(slipID);
     });
  });
}

function delete_slip(slipID){                                                          //delete slip
    const key = datastore.key([SLIP, parseInt(slipID,10)]);
    return datastore.delete(key);
}

/* ------------- End Model Functions ------------- */

/* ------------- Begin Controller Functions ------------- */                                //BOAT section

router.get('/', function(req, res){                                                 //view all boats
    const boats = get_boats()
	.then( (boats) => {
        res.status(200).json(boats);
    });
});

router.get('/:id', function(req, res){                                                 //view specified boat
  const boat = get_that_boat(req.params.id)
	.then( (boat) => {
      if(boat != null){
        res.status(200).json(boat);
      }
      else{
        res.status(404).send({ Error: "No boat with this boat_id exists"});
      }
    });
});

router.post('/', function(req, res){                                                  //add boat
  if (req.body.name && req.body.type && req.body.length) {
    post_boat(req.body.name, req.body.type, req.body.length)
    .then( key => {res.status(201).send('{ "id": ' + key.id + ', "name": "' + req.body.name + '", "type": "' + req.body.type + '", "length": ' + req.body.length + ', "self": "' + "https://hw3-datastore-liuqib.appspot.com/boats/" + key.id +'"}')} );
  }
  else{
    res.status(400).send({ Error: "The request object is missing at least one of the required attributes"});
  }
});

router.patch('/:id', function(req, res){                                              //patch boat
    if (req.body.name && req.body.type && req.body.length) {
    const boat = get_that_boat(req.params.id)
  	.then( (boat) => {
        if(boat != null){
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
    else{
      res.status(400).send({ Error: "The request object is missing at least one of the required attributes"});
    }
});

router.delete('/:boatID', function(req, res){                                            //delete boat
  get_that_boat(req.params.boatID).then((result) => {
  if(result == null){
    res.status(404).send({ Error: "No boat with this boat_id exists"});
  }
  else{
     delete_boat(req.params.boatID).then(res.status(204).end());
  }
    });
});

/* ---------------------------------------------------------SLIP router section-----------------------------------------------------------------------*/
slipRouter.get('/', function(req, res){                                                 //view all slips
    const slips = get_slips()
	.then( (slips) => {
        res.status(200).json(slips);
    });
});

slipRouter.get('/:id', function(req, res){                                                 //view specified slip
    const slip = get_that_slip(req.params.id)
	.then( (slip) => {
      if(slip != null){
        res.status(200).json(slip);
      }
      else{
        res.status(404).send({ Error: "No slip with this slip_id exists"});
      }
    });
});

slipRouter.post('/', function(req, res){                                                  //add slip
  if (req.body.number) {
    post_slip(req.body.number)
    .then( key => {res.status(201).send('{ "id": ' + key.id + ', "number": ' + req.body.number + ', "current_boat": ' + null + ', "self": "' + "https://hw3-datastore-liuqib.appspot.com/slips/" + key.id +'"}')} );
  }
  else{
    res.status(400).send({ Error: "The request object is missing the required number"});
  }
});

slipRouter.put('/:slipID/:boatID', function (req, res) {                          //Boat arrive at slip
  const boat = get_that_boat(req.params.boatID)
	.then( (boat) => {
      if(boat != null){
        get_that_slip(req.params.slipID).then((arrive) => {
          if(arrive == null){
            res.status(404).send({ Error: "The specified boat and/or slip don’t exist"});
          }
          else{
      	   if (arrive["current_boat"] == null) {
      	    const slip = boatArriveSlip (req.params.slipID, req.params.boatID).then((slip) => {
      		  res.status(204).json(slip);});
      	   }
      	   else {
      	    res.status(403).send({ Error: "The slip is not empty"});
      	   }
         }
        });
      }
      else{
        res.status(404).send({ Error: "The specified boat and/or slip don’t exist"});
      }
    });
});

slipRouter.delete('/:slipID/:boatID', function (req, res) {                          //Boat depature from slip
  get_that_slip(req.params.slipID).then((arrive) => {
  if(arrive == null){
    // console.log("err");
    res.status(404).send({ Error: "No boat with this boat_id is at the slip with this slip_id"});
  }
  else{
	   if (arrive["current_boat"] == req.params.boatID) {
       // console.log("it was there");
	     const slip = boatDepartureSlip (req.params.slipID, req.params.boatID).then((slip) => {
		   res.status(204).json(slip);});
	   }
	   else {
	      res.status(404).send({ Error: "No boat with this boat_id is at the slip with this slip_id"});
	     }
  }
    });
});

slipRouter.delete('/:slipID', function(req, res){                                            //delete slip
  get_that_slip(req.params.slipID).then((result) => {
  if(result == null){
    res.status(404).send({ Error: "No slip with this slip_id exists"});
  }
  else{
     delete_slip(req.params.slipID).then(res.status(204).end());
  }
    });
});
/* ------------- End Controller Functions ------------- */

app.use('/boats', router);
app.use('/slips', slipRouter);

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});
