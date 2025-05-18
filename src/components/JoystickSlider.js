import React, { useRef, useEffect, useState } from 'react';

const JoystickSlider = () => {
  const joystickRef = useRef(null);
  const stickRef = useRef(null);
  const sliderRef = useRef(null);
  const thumbRef = useRef(null);

  const maxDist = 70;
  const MIN = 0, MAX = 100;
  const [sliderValue, setSliderValue] = useState(1);

  const socketRef = useRef(null);

  useEffect(() => {
    const jc = joystickRef.current;
    const stick = stickRef.current;
    const sc = sliderRef.current;
    const thumb = thumbRef.current;

    const SLH = sc.clientHeight;
    const THH = thumb.clientHeight;

    // Setup WebSocket
    socketRef.current = new WebSocket('https://droneui.onrender.com');

    socketRef.current.onmessage = (message) => {
      console.log("Received from server:", JSON.parse(message.data));

      const [x, y, sliderVal] = JSON.parse(message.data);
      console.log('Received from server:', x, y, sliderVal);
    };

    // const sendJoystick = (x, y) => {
    //   console.log("Sending joystick:", x, y);

    //   if (socketRef.current.readyState === WebSocket.OPEN) {
    //     socketRef.current.send(JSON.stringify([x, y, null]));
    //   }
    // };

    // const sendSlider = (sliderVal) => {
    //   console.log("Sending slider:", sliderVal);

    //   if (socketRef.current.readyState === WebSocket.OPEN) {
    //     socketRef.current.send(JSON.stringify([null, null, sliderVal]));
    //   }
    // };
    let lastSentJoystick = 0;
let lastSentSlider = 0;
const throttleTime = 50; // ms

const sendJoystick = (x, y) => {
  console.log("Sending joystick:", x, y);
  const now = Date.now();
  if (now - lastSentJoystick > throttleTime) {
    if (socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify([x, y, null]));
      lastSentJoystick = now;
    }
  }
};

const sendSlider = (sliderVal) => {
  console.log("Sending slider:", sliderVal);
  const now = Date.now();
  if (now - lastSentSlider > throttleTime) {
    if (socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify([null, null, sliderVal]));
      lastSentSlider = now;
    }
  }
};

    // ------------------- Joystick -------------------
    let joyActive = false;
    let joyId = null;

    const joySet = (x, y) => {
      if (stick) {
        stick.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      }
    };

    const joyReset = () => {
      joySet(0, 0);
      sendJoystick(0, 0);
    };

    const joyMove = (clientX, clientY) => {
      const r = jc.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = clientX - cx;
      const dy = clientY - cy;
      const dist = Math.min(Math.hypot(dx, dy), maxDist);
      const ang = Math.atan2(dy, dx);
      const x = dist * Math.cos(ang);
      const y = dist * Math.sin(ang);
      const nx = parseFloat((x / maxDist).toFixed(2));
      const ny = parseFloat((y / maxDist).toFixed(2));
      joySet(x, y);
    
      // Only send if values are not both zero (avoid sending defaults during movement)
      if (nx !== 0 || ny !== 0) {
        sendJoystick(nx, ny);
      }
    };

    const handleTouchStartJoy = (e) => {
      const t = e.changedTouches[0];
      joyActive = true;
      joyId = t.identifier;
      stick.style.transition = 'none';
      e.preventDefault();
    };

    const handleTouchMoveJoy = (e) => {
      if (!joyActive) return;
      for (let t of e.changedTouches) {
        if (t.identifier === joyId) {
          joyMove(t.clientX, t.clientY);
          e.preventDefault();
          break;
        }
      }
    };

    const handleTouchEndJoy = (e) => {
      for (let t of e.changedTouches) {
        if (t.identifier === joyId) {
          joyActive = false;
          joyId = null;
          stick.style.transition = 'transform .2s ease';
          joyReset();
          break;
        }
      }
    };

    const handleMouseDownJoy = (e) => {
      joyActive = true;
      stick.style.transition = 'none';

      const move = (ev) => joyMove(ev.clientX, ev.clientY);
      const up = () => {
        joyActive = false;
        joyReset();
        document.removeEventListener('mousemove', move);
        document.removeEventListener('mouseup', up);
      };

      document.addEventListener('mousemove', move);
      document.addEventListener('mouseup', up);
      e.preventDefault();
    };

    // ------------------- Slider -------------------
    let slidActive = false;
    let slidId = null;

    const slidSet = (val) => {
      const pct = (val - MIN) / (MAX - MIN);
      const y = (1 - pct) * (SLH - THH);
      thumb.style.top = `${y}px`;
      setSliderValue(val);
      sendSlider(val); // Only send slider value
    };

    const slidValFromY = (y) => {
      const cy = Math.min(Math.max(y, 0), SLH - THH);
      const pct = 1 - cy / (SLH - THH);
      return Math.round(MIN + pct * (MAX - MIN));
    };

    const handleTouchStartSlider = (e) => {
      const t = e.changedTouches[0];
      slidActive = true;
      slidId = t.identifier;
      e.preventDefault();
    };

    const handleTouchMoveSlider = (e) => {
      if (!slidActive) return;
      for (let t of e.changedTouches) {
        if (t.identifier === slidId) {
          const rect = sc.getBoundingClientRect();
          const val = slidValFromY(t.clientY - rect.top);
          slidSet(val);
          e.preventDefault();
          break;
        }
      }
    };

    const handleTouchEndSlider = (e) => {
      for (let t of e.changedTouches) {
        if (t.identifier === slidId) {
          slidActive = false;
          slidId = null;
          break;
        }
      }
    };

    const handleMouseDownSlider = (e) => {
      slidActive = true;

      const move = (ev) => {
        const rect = sc.getBoundingClientRect();
        const val = slidValFromY(ev.clientY - rect.top);
        slidSet(val);
      };

      const up = () => {
        slidActive = false;
        document.removeEventListener('mousemove', move);
        document.removeEventListener('mouseup', up);
      };

      document.addEventListener('mousemove', move);
      document.addEventListener('mouseup', up);
      e.preventDefault();
    };

    // Add listeners
    stick.addEventListener('touchstart', handleTouchStartJoy, { passive: false });
    document.addEventListener('touchmove', handleTouchMoveJoy, { passive: false });
    document.addEventListener('touchend', handleTouchEndJoy);

    thumb.addEventListener('touchstart', handleTouchStartSlider, { passive: false });
    document.addEventListener('touchmove', handleTouchMoveSlider, { passive: false });
    document.addEventListener('touchend', handleTouchEndSlider);

    stick.addEventListener('mousedown', handleMouseDownJoy);
    thumb.addEventListener('mousedown', handleMouseDownSlider);

    // Init
    slidSet(1);

    return () => {
      document.removeEventListener('touchmove', handleTouchMoveJoy);
      document.removeEventListener('touchend', handleTouchEndJoy);
      document.removeEventListener('touchmove', handleTouchMoveSlider);
      document.removeEventListener('touchend', handleTouchEndSlider);

      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  return (
    <div style={styles.container}>
      <div ref={joystickRef} style={styles.joystick}>
        <div ref={stickRef} style={styles.stick}></div>
      </div>
      <div ref={sliderRef} style={styles.slider}>
        <div ref={thumbRef} style={styles.thumb}></div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    background: '#646464',
    gap: '350px',
    flexWrap: 'wrap',
  },
  joystick: {
    width: '40vw',
    maxWidth: '250px',
    height: '40vw',
    maxHeight: '250px',
    background: '#ddd',
    borderRadius: '50%',
    position: 'relative',
    touchAction: 'none',
  },
  stick: {
    width: '30%',
    height: '30%',
    background: '#555',
    borderRadius: '50%',
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    transition: 'transform .2s ease',
    touchAction: 'none',
    cursor: 'grab',
  },
  slider: {
    width: '10vw',
    maxWidth: '60px',
    height: '40vh',
    maxHeight: '200px',
    background: '#ccc',
    borderRadius: '10px',
    position: 'relative',
    touchAction: 'none',
  },
  thumb: {
    width: '100%',
    height: '15%',
    background: '#333',
    borderRadius: '6px',
    position: 'absolute',
    left: 0,
    cursor: 'grab',
    touchAction: 'none',
  },
};

export default JoystickSlider;
