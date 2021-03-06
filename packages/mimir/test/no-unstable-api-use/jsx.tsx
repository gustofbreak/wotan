export {};

declare namespace JSX {
    interface ElementClass {
        render: any;
    }
}

/** @deprecated */
function FooComponent(props: {foo: string}): false;
function FooComponent(props: {bar: number}): false;
function FooComponent() {
    return false;
}

class BarComponent {
    render() {
        return false;
    }
}

/** @deprecated */
class BazComponent extends BarComponent {}

class BasComponent {
    /** @deprecated */
    constructor(props?: any) {}

    public render() {
        return false;
    }
}

declare var FizzComponent: {
    /** @deprecated */
    new(props: any): {render(): any};
}

let foo = <FooComponent foo="a"/>;
let foo2 = <FooComponent bar="1"></FooComponent>;
let bar = <BarComponent></BarComponent>;
let baz = <BazComponent></BazComponent>;
let bas = <BasComponent bar=""></BasComponent>;
let fizz = <FizzComponent></FizzComponent>;
