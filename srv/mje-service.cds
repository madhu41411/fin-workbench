using {sap.mje as my} from '../db/mje-schema';

service MJEService {
    entity JournalEntries    as projection on my.JournalEntries
        actions {
            action submitForApproval();
            action approve(comment : String);
            action reject(comment : String);
            action postToSAP() returns String;
        };

    entity JournalEntryItems as projection on my.JournalEntryItems;
    entity WorkflowLogs      as projection on my.WorkflowLogs;
    // Dashboard Statistics
    function getDashboardStats() returns String;
}
