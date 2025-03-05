/**
 * @file 캐럿 위치 저장소 - 블록 간 이동 시 위치 유지를 위한 상태 관리
 */
import { CaretPosition, CaretStore } from "./types";

// 메모리 기반 캐럿 저장소 구현
class MemoryCaretStore implements CaretStore {
  private positions: Map<string, CaretPosition> = new Map();

  get(key: string): CaretPosition | null {
    return this.positions.get(key) || null;
  }

  set(key: string, position: CaretPosition): void {
    this.positions.set(key, position);
  }

  remove(key: string): void {
    this.positions.delete(key);
  }

  clear(): void {
    this.positions.clear();
  }
}

// 로컬 스토리지 기반 캐럿 저장소 구현
class LocalStorageCaretStore implements CaretStore {
  private prefix = "caret_";

  get(key: string): CaretPosition | null {
    const data = localStorage.getItem(this.prefix + key);
    if (!data) return null;

    try {
      return JSON.parse(data) as CaretPosition;
    } catch (e) {
      console.error("Failed to parse caret position from localStorage", e);
      return null;
    }
  }

  set(key: string, position: CaretPosition): void {
    try {
      // node는 직렬화할 수 없으므로 제외
      const { node, ...serializable } = position;
      localStorage.setItem(this.prefix + key, JSON.stringify(serializable));
    } catch (e) {
      console.error("Failed to save caret position to localStorage", e);
    }
  }

  remove(key: string): void {
    localStorage.removeItem(this.prefix + key);
  }

  clear(): void {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(this.prefix))
      .forEach((key) => localStorage.removeItem(key));
  }
}

// 기본 인스턴스 생성 및 내보내기
export const memoryCaretStore = new MemoryCaretStore();
export const localCaretStore = new LocalStorageCaretStore();

// 기본 저장소 설정 (필요에 따라 변경 가능)
export const defaultCaretStore = memoryCaretStore;
