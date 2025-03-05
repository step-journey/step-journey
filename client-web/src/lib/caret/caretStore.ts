/**
 * @file 캐럿 위치 저장소 - 블록 간 이동 시 위치 유지를 위한 상태 관리
 */
import { CaretPosition, CaretStore } from "./types";

/**
 * 메모리 기반 캐럿 저장소 구현
 *
 * 애플리케이션 세션 동안 캐럿 위치를 메모리에 저장하는 클래스
 */
class MemoryCaretStore implements CaretStore {
  private positions: Map<string, CaretPosition> = new Map();

  /**
   * 저장된 캐럿 위치 가져오기
   * @param key 캐럿 위치 식별 키
   * @returns 캐럿 위치 또는 null
   */
  get(key: string): CaretPosition | null {
    return this.positions.get(key) || null;
  }

  /**
   * 캐럿 위치 저장하기
   * @param key 캐럿 위치 식별 키
   * @param position 저장할 캐럿 위치
   */
  set(key: string, position: CaretPosition): void {
    this.positions.set(key, position);
  }

  /**
   * 저장된 캐럿 위치 삭제하기
   * @param key 삭제할 캐럿 위치 식별 키
   */
  remove(key: string): void {
    this.positions.delete(key);
  }

  /**
   * 모든 저장된 캐럿 위치 삭제하기
   */
  clear(): void {
    this.positions.clear();
  }

  /**
   * 특정 블록 ID에 대한 모든 캐럿 위치 삭제하기
   * @param blockId 블록 ID
   */
  removeByBlockId(blockId: string): void {
    this.positions.forEach((_, key) => {
      if (key.startsWith(`${blockId}:`)) {
        this.positions.delete(key);
      }
    });
  }
}

/**
 * 로컬 스토리지 기반 캐럿 저장소 구현
 *
 * 페이지 새로고침 후에도 지속되는 캐럿 위치 저장 클래스
 */
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

/**
 * 세션 지속성 캐럿 저장소
 *
 * 브라우저 탭이 열려있는 동안만 유지되는 캐럿 위치 저장소
 */
class SessionCaretStore implements CaretStore {
  private prefix = "caret_";

  get(key: string): CaretPosition | null {
    const data = sessionStorage.getItem(this.prefix + key);
    if (!data) return null;

    try {
      return JSON.parse(data) as CaretPosition;
    } catch (e) {
      console.error("Failed to parse caret position from sessionStorage", e);
      return null;
    }
  }

  set(key: string, position: CaretPosition): void {
    try {
      // node는 직렬화할 수 없으므로 제외
      const { node, ...serializable } = position;
      sessionStorage.setItem(this.prefix + key, JSON.stringify(serializable));
    } catch (e) {
      console.error("Failed to save caret position to sessionStorage", e);
    }
  }

  remove(key: string): void {
    sessionStorage.removeItem(this.prefix + key);
  }

  clear(): void {
    Object.keys(sessionStorage)
      .filter((key) => key.startsWith(this.prefix))
      .forEach((key) => sessionStorage.removeItem(key));
  }
}

// 기본 인스턴스 생성 및 내보내기
export const memoryCaretStore = new MemoryCaretStore();
export const localCaretStore = new LocalStorageCaretStore();
export const sessionCaretStore = new SessionCaretStore();

// 기본 저장소 설정 (필요에 따라 변경 가능)
export const defaultCaretStore = memoryCaretStore;
