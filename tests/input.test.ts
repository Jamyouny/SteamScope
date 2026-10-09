import { describe, it, expect } from 'vitest';
import { parseSteamInput } from '../shared/input';
describe('Steam input parsing', () => {
  it('accepts SteamID64 and profile URLs', () => {
    expect(parseSteamInput(' 76561198000000000 ')).toEqual({
      id: '76561198000000000',
    });
    expect(
      parseSteamInput('https://steamcommunity.com/profiles/76561198000000000/'),
    ).toEqual({ id: '76561198000000000' });
  });
  it('accepts vanity URLs with query strings', () => {
    expect(
      parseSteamInput('https://steamcommunity.com/id/alex_chen/?l=english'),
    ).toEqual({ vanity: 'alex_chen' });
    expect(parseSteamInput('steamcommunity.com/id/test-user')).toEqual({
      vanity: 'test-user',
    });
  });
  it.each([
    '123',
    'https://evil.com/id/foo',
    'https://steamcommunity.com.evil.com/id/foo',
    'https://user@steamcommunity.com/id/foo',
    'https://steamcommunity.com:8080/id/foo',
    'https://steamcommunity.com/id/foo/games',
    'foo',
    'file:///id/foo',
    'https://steamcommunity.com/profiles/7656119800000000',
  ])('rejects invalid input %s', (input) => {
    expect(() => parseSteamInput(input)).toThrow('INVALID_INPUT');
  });
});
