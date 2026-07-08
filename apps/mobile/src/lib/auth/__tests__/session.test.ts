import { getSession, hydrateSession, setSession, subscribeSession } from '../session';
import { clearSession, saveSession } from '../token-store';

jest.mock('../token-store', () => ({
  saveSession: jest.fn().mockResolvedValue(undefined),
  clearSession: jest.fn().mockResolvedValue(undefined),
}));

const SESSION = { accessToken: 'a', refreshToken: 'r', userId: 'user01' };

describe('session', () => {
  afterEach(async () => {
    await setSession(null);
    jest.clearAllMocks();
  });

  it('setSession でメモリ上のセッションが更新され SecureStore に永続化される', async () => {
    await setSession(SESSION);
    expect(getSession()).toEqual(SESSION);
    expect(saveSession).toHaveBeenCalledWith(SESSION);
  });

  it('setSession(null) でセッションが破棄される', async () => {
    await setSession(SESSION);
    await setSession(null);
    expect(getSession()).toBeNull();
    expect(clearSession).toHaveBeenCalled();
  });

  it('購読者はセッション変更を受け取り、解除後は呼ばれない', async () => {
    const listener = jest.fn();
    const unsubscribe = subscribeSession(listener);

    await setSession(SESSION);
    expect(listener).toHaveBeenLastCalledWith(SESSION);

    unsubscribe();
    await setSession(null);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('hydrateSession は永続化せずメモリと購読者へ反映する', () => {
    const listener = jest.fn();
    const unsubscribe = subscribeSession(listener);

    hydrateSession(SESSION);
    expect(getSession()).toEqual(SESSION);
    expect(listener).toHaveBeenLastCalledWith(SESSION);
    expect(saveSession).not.toHaveBeenCalled();

    unsubscribe();
  });
});
