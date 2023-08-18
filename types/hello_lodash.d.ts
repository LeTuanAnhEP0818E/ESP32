interface Person {
    name: string;
    age: number;
}
export declare function groupPeopleByAge(people: Person[]): {
    [age: number]: Person[];
};
export declare function flattenArray(nestedArray: any[]): any[];
export declare function sortByAge(people: Person[]): Person[];
export {};
