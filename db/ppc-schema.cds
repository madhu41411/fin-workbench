namespace sap.ppc;

using {managed} from '@sap/cds/common';

entity CompanyCodes {
    key code        : String(4);
        description : String(100);
}

entity Periods {
    key code        : String(10);
        description : String(100);
}
