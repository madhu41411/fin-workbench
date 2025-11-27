using {
    cuid,
    managed
} from '@sap/cds/common';

service PostingPeriodService {

    entity PostingPeriodRequests : cuid, managed {
        period      : Integer;
        year        : Integer;
        companyCode : String(4);
        reason      : String;
        status      : String enum {
            OPEN;
            CLOSED;
            PENDING;
        };
        ticketId    : String;
        comments    : String;
    }

    entity TimeLogs : cuid, managed {
        requestId : UUID;
        startTime : DateTime;
        endTime   : DateTime;
        duration  : Integer; // in minutes
        activity  : String;
    }

    action openPeriod(period : Integer, year : Integer, companyCode : String, reason : String) returns String;
    action closePeriod(requestId : UUID)                                                       returns String;
}
