service InvoiceService {

    type MatchResult {
        matched    : Boolean;
        confidence : Integer; // 0-100
        reason     : String;
    }

    entity Invoices {
        key ID              : UUID;
            invoiceNumber   : String;
            vendorName      : String;
            amount          : Decimal(10, 2);
            currency        : String(3);
            invoiceDate     : Date;
            status          : String enum {
                Pending;
                Matched;
                Mismatch;
                ManuallyVerified
            };
            sapDocNumber    : String; // Linked SAP Document if found
            matchConfidence : Integer;
            matchReason     : String;
    }

    entity SAPDocuments {
        key ID          : UUID;
            docNumber   : String;
            vendorName  : String;
            amount      : Decimal(10, 2);
            currency    : String(3);
            postingDate : Date;
    }

    // Action to manually verify an invoice
    action   verifyInvoice(invoiceID : UUID, comment : String) returns Boolean;
    // Function to get telemetry data
    function getTelemetry()                                    returns String; // Returns JSON string for dashboard
}
