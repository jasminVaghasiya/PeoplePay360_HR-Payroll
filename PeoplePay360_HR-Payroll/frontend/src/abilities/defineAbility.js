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
        'employee',
        'contract',
        'schedule',
        'attendance',
        'timeoff',
        'payrun',
        'payslip',
        'salary_structure',
        'salary_rule',
        'dashboard'
      ]);
      can(['create', 'read', 'update'], 'user');
      break;

    case 'HR Payroll User':
      can('manage', [
        'employee',
        'contract',
        'schedule',
        'attendance',
        'timeoff',
        'dashboard'
      ]);
      can(['create', 'read', 'update'], ['payrun', 'payslip']);
      can('read', ['salary_structure', 'salary_rule']);
      break;

    case 'HR Manager':
      can('manage', [
        'employee',
        'contract',
        'schedule',
        'attendance',
        'timeoff',
        'dashboard'
      ]);
      can(['create', 'read'], 'user');
      cannot(
        ['manage', 'read', 'create', 'update', 'delete'],
        ['payrun', 'payslip', 'salary_structure', 'salary_rule']
      );
      break;

    case 'Employee':
      can('read', ['employee', 'schedule', 'payslip']);
      can(['create', 'read'], ['attendance', 'timeoff']);
      break;

    default:
      can('read', 'employee');
      break;
  }

  return build();
};
