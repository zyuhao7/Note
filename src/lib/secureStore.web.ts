// Web 平台：基于 localStorage（浏览器无安全存储，仅本机持久化）。
export async function getItem(key: string): Promise<string | null> {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export async function setItem(key: string, value: string): Promise<void> {
  localStorage.setItem(key, value);
}

export async function removeItem(key: string): Promise<void> {
  localStorage.removeItem(key);
}
