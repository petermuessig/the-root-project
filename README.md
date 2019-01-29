# the-root-project

## Overview

Simple OpenUI5 file browser using the TreeTable and a custom JSONModel including JSONListBinding. The custom JSONModel takes care to load JSON data from the backend service and makes it available for the TreeTable. The JSONListBinding is a hybrid ListBinding and TreeBinding built especially for the TreeTable to display the nodes inside the TreeTable control. Only the necessary amount of data is being loaded here. Once nodes are loaded it will ensure to load the necessary nodes incl. more nodes as define via threshold (just check the ```/data?top=0&length=100``` requests in the network trace). The loaded nodes will be aggregated inside the model to avoid loading the nodes again and again. When exanding or collapsing the model is cleared for simplicity reasons. The server is implemented in ```lib/server.js```. Here you can see for the data handler how the list is transported to the client. Just call ```http://localhost:3000/data?top=0&length=100``` to test expand and collapse just call ```http://localhost:3000/data?toggle=0```.

## Getting started

To get started just clone this project and run:

```bash
npm i
```

Once the dependencies are downloaded you can run the server with:

```bash
npm start
```

To run the sample in the browser use the following URL:

```
http://localhost:3000
```

## Insights

Checkout the code inside of:

* ```webapp/model/Model.js```
* ```webapp/model/ListBinding.js```

The Model takes care about loading the data from the server and the ListBinding is the connection to the TreeTable control. Currently the ListBinding is only implemented to fetch the data from the server and to handle expand and collapse. Not more. The implementation is not really smart yet and with more time this complete loading behavior can be optimized in a much better fashion. But it at least sketches the basic idea of using the Model and the ListBinding as just a delegation to a server to load just an excerpt of the data needed for the client.
