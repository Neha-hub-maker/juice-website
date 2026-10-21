"use client";

import { useSyncExternalStore } from "react";

type Connection = EventTarget & { saveData?: boolean; effectiveType?: string };
type DeviceNavigator = Navigator & { deviceMemory?: number; connection?: Connection };

function subscribe(notify: () => void) {
  const connection = (navigator as DeviceNavigator).connection;
  connection?.addEventListener("change", notify);
  return () => connection?.removeEventListener("change", notify);
}

function snapshot() {
  const device = navigator as DeviceNavigator;
  const fewerCores = device.hardwareConcurrency > 0 && device.hardwareConcurrency < 4;
  const lessMemory = device.deviceMemory !== undefined && device.deviceMemory < 4;
  const slowConnection = ["slow-2g", "2g"].includes(device.connection?.effectiveType ?? "");
  return fewerCores || lessMemory || slowConnection || device.connection?.saveData === true;
}

/** A conservative capability hint, not a measurement of battery or GPU speed. */
export function useLowPower() {
  return useSyncExternalStore(subscribe, snapshot, () => true);
}
