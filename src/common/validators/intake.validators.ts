import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isAfterDate', async: false })
export class IsAfterDateConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    const [relatedPropertyName] = args.constraints as [string];
    const relatedValue = (args.object as Record<string, unknown>)[
      relatedPropertyName
    ];

    if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
      return false;
    }
    if (!(relatedValue instanceof Date) || Number.isNaN(relatedValue.getTime())) {
      return false;
    }

    return value.getTime() > relatedValue.getTime();
  }

  defaultMessage(args: ValidationArguments): string {
    const [relatedPropertyName] = args.constraints as [string];
    return `${args.property} must be after ${relatedPropertyName}`;
  }
}

export function IsAfterDate(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [property],
      validator: IsAfterDateConstraint,
    });
  };
}

@ValidatorConstraint({ name: 'atLeastOneOf', async: false })
export class AtLeastOneOfConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    const fields = args.constraints as string[];
    const obj = (
      value && typeof value === 'object' ? value : args.object
    ) as Record<string, unknown>;

    return fields.some((field) => {
      const v = obj[field];
      if (v === undefined) return false;
      if (typeof v === 'string') return v.trim().length > 0;
      return true; // includes null / 0 / false as explicitly provided
    });
  }

  defaultMessage(args: ValidationArguments): string {
    const fields = (args.constraints as string[]).join(', ');
    return `At least one of the following fields is required: ${fields}`;
  }
}

export function AtLeastOneOf(
  fields: string[],
  validationOptions?: ValidationOptions,
) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: fields,
      validator: AtLeastOneOfConstraint,
    });
  };
}
