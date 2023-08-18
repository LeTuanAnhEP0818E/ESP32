import "../env.config";
import { describe, expect, test } from "@jest/globals";

import { PersistentWithSign } from "../../src/utils";
import { Wallet } from "ethers";

describe("Persistent", () => {
    var wallet = new Wallet(process.env.IOT_PK ?? "");
    var p = new PersistentWithSign("./static", wallet);

    test("Save_Success", () => {
        p.save({ a: "b", a2: "1" });
    });

    test("Multiple_Success", () => {
        p.save({ a: "b", a2: "1" });
        p.save({ a: "c", a2: "2" });
        p.save({ a: "d", a2: "3" });
        p.save({ a: "e", a2: "4" });
    });
});
