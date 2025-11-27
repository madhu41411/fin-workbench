using {
    cuid,
    managed
} from '@sap/cds/common';
using {sap.ppc} from '../db/ppc-schema';

service PostingPeriodService {

    @readonly
    entity CompanyCodes as projection on ppc.CompanyCodes;

    @readonly
    entity Periods      as projection on ppc.Periods;

    entity PostingPeriodRequests : cuid, managed {
        period      : String(10);
        year        : Integer;
        companyCode : String(4);
        variant     : String;
        reason      : String;
        status      : String enum {
            OPEN;
            CLOSED;
            PENDING;
        };
        ticketId    : String;
        comments    : String;
        payload     : LargeString;
    }

    entity TimeLogs : cuid, managed {
        requestId : UUID;
        startTime : DateTime;
        endTime   : DateTime;
        duration  : Integer; // in minutes
        activity  : String;
    }

    action openPeriod(period : String(10), year : Integer, companyCode : String, variant : String, reason : String)  returns String;
    action closePeriod(period : String(10), year : Integer, companyCode : String, variant : String, reason : String) returns String;
    action closeRequest(requestId : UUID)                                                                            returns String;
    action sendToSap(requestId : UUID)                                                                               returns String;
}
