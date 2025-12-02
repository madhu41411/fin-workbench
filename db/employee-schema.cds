namespace sap.employee;

entity T_EMPLOYEE_MASTER {
    key EMPLOYEE_ID         : String(20);
        FIRST_NAME          : String(100);
        LAST_NAME           : String(100);
        EMAIL               : String(255);
        DATE_OF_BIRTH       : Date;
        EMP_STATUS_ID       : Integer;
        STATUS_CHANGED_DATE : Date;
        // Associations
        STATUS              : Association to EMPLOYEE_STATUS
                                  on STATUS.STATUS_ID = EMP_STATUS_ID;
        QUALIFICATIONS      : Association to many T_EMPLOYEE_QUALIFICATIONS
                                  on QUALIFICATIONS.EMPLOYEE_ID = EMPLOYEE_ID;
}

entity T_EMPLOYEE_QUALIFICATIONS {
    key QUALIFICATION_ID : UUID;
        EMPLOYEE_ID      : String(20);
        DEGREE           : String(100);
        UNIVERSITY       : String(100);
        GRADUATION_YEAR  : Integer;
        // Associations
        EMPLOYEE         : Association to T_EMPLOYEE_MASTER
                               on EMPLOYEE.EMPLOYEE_ID = EMPLOYEE_ID;
}

entity EMPLOYEE_STATUS {
    key STATUS_ID   : Integer;
        STATUS_NAME : String(50);
}
