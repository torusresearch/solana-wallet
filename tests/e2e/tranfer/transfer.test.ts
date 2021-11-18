import test, { expect } from "@playwright/test";

import { login } from "../../auth-helper";
import { ensureTextualElementExists, wait } from "../../utils";

test("Transfer Page Should render", async ({ context }) => {
  const page = await login(context);

  // see navigation works correctly
  await page.click("text=Transfer");
  await wait(1000);
  await expect(page.url().endsWith("/wallet/transfer")).toBeTruthy();

  // ENSURE UI IS INTACT
  await ensureTextualElementExists(page, "Transfer Details");

  // if address is not a valid sol address, should show error
  await page.fill("input[type='text']", "asdasdasdasdasdasd");
  await page.fill("input[type='number']", "1");
  await page.click("button:has-text('Transfer')");
  await expect(await (await page.$$("text=Invalid SOL Address")).length).toEqual(1);

  // if address is a valid sol address, should show popup
  await page.fill("input[type='text']", "5YQHtZcg8EQo3rjVL2PmFwFix1x8i3PjDsyuW6kkQ9rF");
  await page.fill("input[type='number']", "1");
  await page.click("button:has-text('Transfer')");
  await wait(1000);
  await expect(await (await page.$$("text=Total Cost")).length).toEqual(1);
});
