using {
    cuid,
    managed
} from '@sap/cds/common';

service SBPAService {

    entity ProcessInstances : cuid, managed {
        sbpaInstanceId    : String; // SBPA process instance ID
        processDefinition : String; // Which SBPA process was triggered
        sourceEntity      : String; // 'MJE', 'PPC', etc.
        sourceEntityId    : UUID; // ID of the MJE/PPC request
        status            : String enum {
            Running;
            Completed;
            Error;
            Cancelled;
        };
        startedAt         : DateTime;
        completedAt       : DateTime;
        result            : String; // 'Approved', 'Rejected', etc.
        errorMessage      : String;
    }

    entity ProcessEvents : cuid, managed {
        processInstance : Association to ProcessInstances;
        eventType       : String; // 'Started', 'TaskCompleted', 'Completed'
        eventData       : LargeString; // JSON payload
        receivedAt      : DateTime;
    }

    // Action to trigger SBPA process
    action triggerApproval(sourceEntity : String,
                           sourceEntityId : UUID,
                           processDefinition : String,
                           payload : LargeString) returns {
        instanceId : UUID;
        sbpaInstanceId : String;
    };

    // Query process status
    action getProcessStatus(instanceId : UUID)    returns {
        status : String;
        result : String;
    };
}
