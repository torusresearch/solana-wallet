// const { test} = require("@playwright/test");
import test, { expect } from "@playwright/test";

import { login } from "../../auth-helper";
import { ensureTextualElementExists, wait } from "../../utils";

test("Settings Page Should render", async ({ context }) => {
  const page = await login(context);

  // // see navigation works correctly
  await page.click("text=settings");
  await wait(1000);
  await expect(page.url().endsWith("/wallet/settings")).toBeTruthy();

  // ENSURE UI IS INTACT
  await ensureTextualElementExists(page, "Settings");
  await ensureTextualElementExists(page, "Privacy and Security");
  await ensureTextualElementExists(page, "Network");
  await ensureTextualElementExists(page, "Display");
  await ensureTextualElementExists(page, "Crash Reporting");

  // **************NETWORK CHANGES********
  // NETWORK CHANGES TESTING : MAINNET
  await page.click("#network_select");
  await page.click("ul[role='listbox'] div:has-text('Solana Mainnet')");
  await page.click("text=Home");
  await ensureTextualElementExists(page, "Solana Mainnet");
  await page.click("text=settings");

  // NETWORK CHANGES TESTING : TESTNET
  await page.click("#network_select");
  await page.click("ul[role='listbox'] div:has-text('Solana Testnet')");
  await page.click("text=Home");
  await ensureTextualElementExists(page, "Solana Testnet");
  await page.click("text=settings");

  // NETWORK CHANGES TESTING : DEVNET
  await page.click("#network_select");
  await page.click("ul[role='listbox'] div:has-text('Solana Devnet')");
  await page.click("text=Home");
  await ensureTextualElementExists(page, "Solana Devnet");
  await page.click("text=settings");

  // **************DISPLAY CHANGES********
  // CHOOSE LIGHT
  await page.click("text=Light");
  await expect(await (await page.$$(".dark")).length).toEqual(0);

  // CHOOSE DARK
  await page.click("text=Dark");
  await expect(await (await page.$$(".dark")).length).toEqual(1);
});
