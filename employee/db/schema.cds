namespace sap.employee;

entity T_EMPLOYEE_MASTER {
    key EMPLOYEE_ID         : Integer;
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
        EMPLOYEE_ID      : Integer;
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

view V_EMPLOYEE as
    select from T_EMPLOYEE_MASTER as master
    left join T_EMPLOYEE_QUALIFICATIONS as qual
        on master.EMPLOYEE_ID = qual.EMPLOYEE_ID
    left join EMPLOYEE_STATUS as status
        on master.EMP_STATUS_ID = status.STATUS_ID
    {
        key master.EMPLOYEE_ID,
            master.FIRST_NAME,
            master.LAST_NAME,
            master.EMAIL,
            master.DATE_OF_BIRTH,
            qual.DEGREE,
            qual.UNIVERSITY,
            qual.GRADUATION_YEAR,
            status.STATUS_NAME         as EMP_STATUS_NAME,
            master.STATUS_CHANGED_DATE as STATUS_CHANGE_DATE
    };
