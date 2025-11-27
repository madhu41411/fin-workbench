namespace sap.mje;

using {
    managed,
    cuid
} from '@sap/cds/common';

entity JournalEntries : cuid, managed {
    companyCode              : String(4);
    postingDate              : Date;
    documentDate             : Date;
    headerText               : String(255);
    status                   : String(20) default 'Draft'; // Draft, Pending, Approved, Rejected
    currency                 : String(3);
    items                    : Composition of many JournalEntryItems
                                   on items.parent = $self;
    workflowLogs             : Composition of many WorkflowLogs
                                   on workflowLogs.parent = $self;
    totalAmount              : Decimal(15, 2);
    accountingDocumentNumber : String(10);
}

entity JournalEntryItems : cuid {
    parent       : Association to JournalEntries;
    glAccount    : String(10);
    amount       : Decimal(15, 2);
    dcIndicator  : String(1); // D = Debit, C = Credit
    costCenter   : String(10);
    profitCenter : String(10);
    itemText     : String(50);
}

entity WorkflowLogs : cuid, managed {
    parent    : Association to JournalEntries;
    action    : String(50); // Submit, Approve, Reject
    actor     : String(100);
    comment   : String(500);
    timestamp : DateTime;
}
