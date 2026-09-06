import { AbilityBuilder, createMongoAbility } from '@casl/ability';

export const defineAbilityFor = (user) => {
  const { can, cannot, build } = new AbilityBuilder(createMongoAbility);

  if (!user || !user.role) {
    return build();
  }

  switch (user.role) {
    case 'Admin':
      can('manage', 'all');
      break;

    case 'HR Payroll Manager':
      can('manage', [
        'user',
        'employee',
        'contract',
        'schedule',
        'attendance',
        'timeoff',
        'payrun',
        'payslip',
        'salary_structure',
        'salary_rule',
        'dashboard',
        'setting'
      ]);
      break;

    case 'HR Payroll User':
      can('manage', [
        'user',
        'employee',
        'contract',
        'schedule',
        'attendance',
        'timeoff',
        'dashboard'
      ]);
      can(['create', 'read', 'update'], ['payrun', 'payslip']);
      cannot('delete', ['payrun', 'payslip']);
      can('read', ['salary_structure', 'salary_rule']);
      cannot(['create', 'update', 'delete'], ['salary_structure', 'salary_rule']);
      cannot(['manage', 'read', 'create', 'update', 'delete'], ['setting']);
      break;

    case 'HR Manager':
      can('manage', [
        'user',
        'employee',
        'contract',
        'schedule',
        'attendance',
        'timeoff',
        'dashboard'
      ]);
      can(['approve', 'refuse'], 'timeoff');
      cannot(
        ['manage', 'read', 'create', 'update', 'delete', 'compute', 'validate', 'pay'],
        ['payroll', 'payrun', 'payslip', 'salary_structure', 'salary_rule', 'salary', 'setting']
      );
      break;

    case 'Employee':
      can('read', ['schedule', 'payslip', 'salary_structure', 'salary_rule']);
      can(['create', 'read'], ['attendance', 'timeoff']);
      cannot(['create', 'update', 'delete'], ['payslip', 'salary_structure', 'salary_rule']);
      cannot(
        ['manage', 'read', 'create', 'update', 'delete'],
        ['user', 'contract', 'payrun', 'setting']
      );
      break;

    default:
      break;
  }

  return build();
};
