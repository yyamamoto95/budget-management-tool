import type { BalanceType } from '@budget/common';

export type CategoryProps = {
    id: number;
    key: string;
    name: string;
    color: string;
    bg: string;
    balanceType: BalanceType;
    displayOrder: number;
    isSystem: boolean;
    isDeleted: boolean;
};

export class Category {
    readonly id: number;
    readonly key: string;
    readonly name: string;
    readonly color: string;
    readonly bg: string;
    readonly balanceType: BalanceType;
    readonly displayOrder: number;
    readonly isSystem: boolean;
    readonly isDeleted: boolean;

    private constructor(props: CategoryProps) {
        this.id = props.id;
        this.key = props.key;
        this.name = props.name;
        this.color = props.color;
        this.bg = props.bg;
        this.balanceType = props.balanceType;
        this.displayOrder = props.displayOrder;
        this.isSystem = props.isSystem;
        this.isDeleted = props.isDeleted;
    }

    static reconstruct(props: CategoryProps): Category {
        return new Category(props);
    }
}
