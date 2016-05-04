var SAAgent = null;
var SASocket = null;
var CHANNELID = 104;
var ProviderAppName = "Clases";
var RequestBuffer = null;

function connect() {
	if (SASocket) {
        return false;
    }
	try {
		webapis.sa.requestSAAgent(onsuccess, onerror);
	} catch(err) {
		console.log("exception [" + err.name + "] msg[" + err.message + "]");
	}
}
function onsuccess(agents) {
	try {
		if (agents.length > 0) {
			SAAgent = agents[0];
			SAAgent.setPeerAgentFindListener(peerAgentFindCallback);
			SAAgent.findPeerAgents();
		} else {
			alert("Not found SAAgent!!");
		}
	} catch(err) {
		console.log("exception [" + err.name + "] msg[" + err.message + "]");
	}
}
function onerror(err) {
	console.log("err [" + err.name + "] msg[" + err.message + "]");
	failure();
}
function failure() {
	var view = mView === 1 ? $('#class-view') : '#pagedate-' + (nextItem || mPageDate);
	$(view).removeClass('loading-view').addClass('error-view').empty();
	$('#pagedate-' + (nextItem || mPageDate)).removeClass('loading-view').addClass('error-view').empty();
}

var agentCallback = {
	onconnect : function(socket) {
		SASocket = socket;
		SASocket.setSocketStatusListener(function(reason){
			console.log("Service connection lost, Reason : [" + reason + "]");
			failure();
			disconnect();
		});
		onconnected();
	},
	onerror : onerror
};

var peerAgentFindCallback = {
	onpeeragentfound : function(peerAgent) {
		try {
			if (peerAgent.appName == ProviderAppName) {
				SAAgent.setServiceConnectionListener(agentCallback);
				SAAgent.requestServiceConnection(peerAgent);
			}
		} catch(err) {
			console.log("exception [" + err.name + "] msg[" + err.message + "]");
		}
	},
	onerror : onerror
}

function disconnect() {
	try {
		if (SASocket != null) {
			SASocket.close();
			SASocket = null;
			RequestBuffer = null;
		}
	} catch(err) {
		console.log("exception [" + err.name + "] msg[" + err.message + "]");
	}
}

function fetch(message) {
	try {
		SASocket.setDataReceiveListener(onreceive);
		SASocket.sendData(CHANNELID, message);
	} catch(err) {
		console.log("exception [" + err.name + "] msg[" + err.message + "]");
	}
}

function sendFetch(message) {
	connect();
	if (SASocket) {
		fetch(message);
    } else {
    	RequestBuffer = message;
    }
}

function onconnected() {
	if (RequestBuffer != null) {
		sendFetch(RequestBuffer);
	}
}