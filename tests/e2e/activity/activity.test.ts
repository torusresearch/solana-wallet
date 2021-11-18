// const { test} = require("@playwright/test");
import test, { expect } from "@playwright/test";

import { login } from "../../auth-helper";
import { ensureTextualElementExists, wait } from "../../utils";

test("Activity Page Should render", async ({ context }) => {
  const page = await login(context);

  // // see navigation works correctly
  await page.click("text=Activity");
  await wait(1000);
  await expect(page.url().endsWith("/wallet/activity")).toBeTruthy();

  // ENSURE UI IS INTACT
  await ensureTextualElementExists(page, "Transaction Activities");
});
