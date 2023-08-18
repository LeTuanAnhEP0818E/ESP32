#!/bin/bash

# Create new TypeScript project
# npm install typescript -g
mkdir my-new-ts-project
cd my-new-ts-project

# Init and config git
git init
echo 'node_modules
dist
*.log
*.tsbuildinfo
coverage
.nyc_output
.env
*.env
.DS_Store
*.orig
.idea
.vscode
*.iml
yarn-error.log
npm-debug.log
logs
*.log.*
*.swp
.pnp*
*.pid
*.seed
*.pid.lock
yarn.lock
.npmrc
.prettierignore
.prettierrc
tsconfig.tsbuildinfo
**/node_modules
' > .gitignore

# init package.json
cat << EOF > package.json 
{
  "name": "my project name",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "dev": "tsc-watch --onSuccess \"npm start\"",
    "start": "node ./dist/app.js",
    "test": "jest"
  },
  "keywords": [],
  "author": "",
  "license": "ISC"
}
EOF

# install typescript packages to local
npm install typescript tsc-watch --save-dev

# init tsconfig.json
cat << EOF > tsconfig.json
{
  "compilerOptions": {
    /* Visit https://aka.ms/tsconfig to read more about this file */
    "target": "es2016",                                  /* Set the JavaScript language version for emitted JavaScript and include compatible library declarations. */
    "module": "commonjs",                                /* Specify what module code is generated. */
    "outDir": "./dist",                                   /* Specify an output folder for all emitted files. */
    "esModuleInterop": true,                             /* Emit additional JavaScript to ease support for importing CommonJS modules. This enables 'allowSyntheticDefaultImports' for type compatibility. */
    "forceConsistentCasingInFileNames": true,            /* Ensure that casing is correct in imports. */
    "strict": true,                                      /* Enable all strict type-checking options. */
    "skipLibCheck": true                                 /* Skip type checking all .d.ts files. */
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "src/test"],
}
EOF

# Install & Config Jest
npm install jest @types/jest ts-jest ts-node --save-dev
echo "module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};" > jest.config.js

# Install lodash & Create sample test file
npm install lodash
npm install @types/lodash --save-dev

mkdir src
echo "import _ from 'lodash';

interface Person {
    name: string;
    age: number;
}

export function groupPeopleByAge(people: Person[]): { [age: number]: Person[] } {
    return _.groupBy(people, 'age');
}

export function flattenArray(nestedArray: any[]): any[] {
    return _.flattenDeep(nestedArray);
}

export function sortByAge(people: Person[]): Person[] {
    return _.sortBy(people, 'age');
}
" > src/hello_lodash.ts

mkdir -p src/test
echo "import { groupPeopleByAge, flattenArray, sortByAge } from '../hello_lodash';

describe('groupPeopleByAge', () => {
    it('should group people by their age', () => {
        const people = [
            { name: 'Alice', age: 25 },
            { name: 'Bob', age: 30 },
            { name: 'Charlie', age: 25 },
            { name: 'Dave', age: 30 },
        ];

        const groupedPeople = groupPeopleByAge(people);

        expect(groupedPeople).toEqual({
            25: [
                { name: 'Alice', age: 25 },
                { name: 'Charlie', age: 25 },
            ],
            30: [
                { name: 'Bob', age: 30 },
                { name: 'Dave', age: 30 },
            ],
        });
    });
});

describe('flattenArray', () => {
    it('should flatten a nested array', () => {
        const nestedArray = [[1, 2], [3, 4, [5, 6]], 7, [8, [9, [10, 11, [12]]]]];
        const flattenedArray = flattenArray(nestedArray);
        expect(flattenedArray).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    });
});

describe('sortByAge', () => {
    it('should sort people by their age', () => {
        const people = [
            { name: 'Alice', age: 25 },
            { name: 'Bob', age: 30 },
            { name: 'Charlie', age: 20 },
            { name: 'Dave', age: 35 }
        ];

        const sortedPeople = sortByAge(people);

        expect(sortedPeople).toEqual([
            { name: 'Charlie', age: 20 },
            { name: 'Alice', age: 25 },
            { name: 'Bob', age: 30 },
            { name: 'Dave', age: 35 }
        ]);
    });
});
" > src/test/hello_lodash.test.ts

# Run the fist test
# npm test
