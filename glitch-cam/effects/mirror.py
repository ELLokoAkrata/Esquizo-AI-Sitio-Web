import cv2
import numpy as np


def screen_mir2(frame):
    """Espejo bilateral — mitad izquierda reflejada a la derecha."""
    h, w = frame.shape[:2]
    result = frame.copy()
    result[:, w // 2:] = cv2.flip(frame[:, :w // 2], 1)[:, :w - w // 2]
    return result


def screen_kl4(frame):
    """Kaleido 4 cuadrantes — de vértice a vértice."""
    h, w = frame.shape[:2]
    tl  = frame[:h // 2, :w // 2].copy()
    top = np.concatenate([tl, cv2.flip(tl, 1)], axis=1)
    return np.concatenate([top, cv2.flip(top, 0)], axis=0)


def screen_kl8(frame):
    """Kaleido 8 sectores — triángulo reflejado radialmente."""
    h, w = frame.shape[:2]
    s   = min(h // 2, w // 2)
    tl  = cv2.resize(frame[:h // 2, :w // 2], (s, s))
    anti = cv2.transpose(cv2.flip(tl, 1))
    y_g, x_g = np.mgrid[0:s, 0:s].astype(np.float32)
    diag = (y_g < x_g).astype(np.float32)[:, :, np.newaxis]
    seg  = (tl.astype(np.float32) * (1 - diag) + anti.astype(np.float32) * diag).astype(np.uint8)
    top  = np.concatenate([seg, cv2.flip(seg, 1)], axis=1)
    k    = np.concatenate([top, cv2.flip(top, 0)], axis=0)
    return cv2.resize(k, (w, h))


def screen_kl16(frame):
    """Kaleido 16 — doble kaleido, máxima potencia de espejo."""
    return screen_kl4(screen_kl8(frame))


MIRROR_FUNCS = {1: screen_mir2, 2: screen_kl4, 3: screen_kl8, 4: screen_kl16}
MIRROR_NAMES = {0: 'OFF', 1: 'MIR2', 2: 'KL4', 3: 'KL8', 4: 'KL16'}
