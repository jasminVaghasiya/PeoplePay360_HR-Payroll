const { AbilityBuilder, createMongoAbility } = require("@casl/ability");
const { ROLE, SUBJECTS, ACTIONS } = require("../models/types");

const defineAbilitiesFor = (user) => {
  const { can, cannot, build } = new AbilityBuilder(createMongoAbility);

  const userId = user?.id ? user.id.toString() : undefined;

  switch (user?.role) {
    case ROLE.ADMIN:
      can([ACTIONS.MANAGE], "all");
      break;

    case ROLE.HR_PAYROLL_MANAGER:
      can(
        [ACTIONS.MANAGE],
        [
          SUBJECTS.EMPLOYEE,
          SUBJECTS.CONTRACT,
          SUBJECTS.SCHEDULE,
          SUBJECTS.ATTENDANCE,
          SUBJECTS.TIMEOFF,
          SUBJECTS.PAYRUN,
          SUBJECTS.PAYSLIP,
          SUBJECTS.SALARY_STRUCTURE,
          SUBJECTS.SALARY_RULE,
          SUBJECTS.DASHBOARD
        ]
      );
      can([ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE], SUBJECTS.USER);
      break;

    case ROLE.HR_PAYROLL_USER:
      can(
        [ACTIONS.MANAGE],
        [
          SUBJECTS.EMPLOYEE,
          SUBJECTS.CONTRACT,
          SUBJECTS.SCHEDULE,
          SUBJECTS.ATTENDANCE,
          SUBJECTS.TIMEOFF,
          SUBJECTS.DASHBOARD
        ]
      );
      can([ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE], [SUBJECTS.PAYRUN, SUBJECTS.PAYSLIP]);
      can([ACTIONS.READ], [SUBJECTS.SALARY_STRUCTURE, SUBJECTS.SALARY_RULE]);
      break;

    case ROLE.HR_MANAGER:
      can(
        [ACTIONS.MANAGE],
        [
          SUBJECTS.EMPLOYEE,
          SUBJECTS.CONTRACT,
          SUBJECTS.SCHEDULE,
          SUBJECTS.ATTENDANCE,
          SUBJECTS.TIMEOFF,
          SUBJECTS.DASHBOARD
        ]
      );
      can([ACTIONS.CREATE, ACTIONS.READ], SUBJECTS.USER);
      cannot(
        [ACTIONS.MANAGE, ACTIONS.READ, ACTIONS.CREATE, ACTIONS.UPDATE, ACTIONS.DELETE],
        [SUBJECTS.PAYRUN, SUBJECTS.PAYSLIP, SUBJECTS.SALARY_STRUCTURE, SUBJECTS.SALARY_RULE]
      );
      break;

    case ROLE.EMPLOYEE:
      can([ACTIONS.READ], [SUBJECTS.EMPLOYEE, SUBJECTS.SCHEDULE, SUBJECTS.PAYSLIP]);
      can([ACTIONS.CREATE, ACTIONS.READ], [SUBJECTS.ATTENDANCE, SUBJECTS.TIMEOFF]);
      break;

    default:
      can([ACTIONS.READ], SUBJECTS.EMPLOYEE);
      break;
  }

  return build({
    detectSubjectType: (item) =>
      item
        ? item.__caslSubjectType__ ||
          item.__type ||
          item.constructor?.modelName ||
          item.constructor?.name
        : undefined
  });
};

module.exports = {
  defineAbilitiesFor
};
