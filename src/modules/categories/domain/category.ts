import { Entity } from "@/shared/kernel/entity";
import { err, ok, type Result } from "@/shared/kernel/result";

export interface CategoryProps {
  id: string;
  userId: string;
  name: string;
  color: string;
  icon: string;
}

const HEX_COLOR_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/**
 * Category entity — a user-owned, flat spending category. Identity is the
 * `cat_…` id; two categories are equal iff they share an id.
 */
export class Category extends Entity<string> {
  readonly userId: string;
  private _name: string;
  private _color: string;
  private _icon: string;

  private constructor(props: CategoryProps) {
    super(props.id);
    this.userId = props.userId;
    this._name = props.name;
    this._color = props.color;
    this._icon = props.icon;
  }

  get name(): string {
    return this._name;
  }

  get color(): string {
    return this._color;
  }

  get icon(): string {
    return this._icon;
  }

  static create(props: CategoryProps): Result<Category, string> {
    const nameValidation = Category.validateName(props.name);
    if (!nameValidation.ok) return nameValidation;
    if (!HEX_COLOR_RE.test(props.color)) {
      return err("Color must be a hex value like #22c55e");
    }
    if (props.icon.trim().length === 0) {
      return err("Icon is required");
    }
    return ok(
      new Category({
        ...props,
        name: props.name.trim(),
        color: props.color.toLowerCase(),
        icon: props.icon.trim(),
      }),
    );
  }

  /** Reconstitutes a persisted Category without revalidation. */
  static reconstitute(props: CategoryProps): Category {
    return new Category(props);
  }

  private static validateName(name: string): Result<string, string> {
    const trimmed = name.trim();
    if (trimmed.length === 0) return err("Name is required");
    if (trimmed.length > 60) return err("Name must be 60 characters or fewer");
    return ok(trimmed);
  }

  rename(name: string): Result<void, string> {
    const validation = Category.validateName(name);
    if (!validation.ok) return validation;
    this._name = validation.value;
    return ok(undefined);
  }

  changeAppearance(color: string, icon: string): Result<void, string> {
    if (!HEX_COLOR_RE.test(color)) {
      return err("Color must be a hex value like #22c55e");
    }
    if (icon.trim().length === 0) {
      return err("Icon is required");
    }
    this._color = color.toLowerCase();
    this._icon = icon.trim();
    return ok(undefined);
  }
}
