var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// node_modules/unenv/dist/runtime/_internal/utils.mjs
// @__NO_SIDE_EFFECTS__
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
// @__NO_SIDE_EFFECTS__
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name(() => {
    throw /* @__PURE__ */ createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
// @__NO_SIDE_EFFECTS__
function notImplementedClass(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
var init_utils = __esm({
  "node_modules/unenv/dist/runtime/_internal/utils.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    __name(createNotImplementedError, "createNotImplementedError");
    __name(notImplemented, "notImplemented");
    __name(notImplementedClass, "notImplementedClass");
  }
});

// node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs
var _timeOrigin, _performanceNow, nodeTiming, PerformanceEntry, PerformanceMark, PerformanceMeasure, PerformanceResourceTiming, PerformanceObserverEntryList, Performance, PerformanceObserver, performance2;
var init_performance = __esm({
  "node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_utils();
    _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
    _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
    nodeTiming = {
      name: "node",
      entryType: "node",
      startTime: 0,
      duration: 0,
      nodeStart: 0,
      v8Start: 0,
      bootstrapComplete: 0,
      environment: 0,
      loopStart: 0,
      loopExit: 0,
      idleTime: 0,
      uvMetricsInfo: {
        loopCount: 0,
        events: 0,
        eventsWaiting: 0
      },
      detail: void 0,
      toJSON() {
        return this;
      }
    };
    PerformanceEntry = class {
      static {
        __name(this, "PerformanceEntry");
      }
      __unenv__ = true;
      detail;
      entryType = "event";
      name;
      startTime;
      constructor(name, options) {
        this.name = name;
        this.startTime = options?.startTime || _performanceNow();
        this.detail = options?.detail;
      }
      get duration() {
        return _performanceNow() - this.startTime;
      }
      toJSON() {
        return {
          name: this.name,
          entryType: this.entryType,
          startTime: this.startTime,
          duration: this.duration,
          detail: this.detail
        };
      }
    };
    PerformanceMark = class PerformanceMark2 extends PerformanceEntry {
      static {
        __name(this, "PerformanceMark");
      }
      entryType = "mark";
      constructor() {
        super(...arguments);
      }
      get duration() {
        return 0;
      }
    };
    PerformanceMeasure = class extends PerformanceEntry {
      static {
        __name(this, "PerformanceMeasure");
      }
      entryType = "measure";
    };
    PerformanceResourceTiming = class extends PerformanceEntry {
      static {
        __name(this, "PerformanceResourceTiming");
      }
      entryType = "resource";
      serverTiming = [];
      connectEnd = 0;
      connectStart = 0;
      decodedBodySize = 0;
      domainLookupEnd = 0;
      domainLookupStart = 0;
      encodedBodySize = 0;
      fetchStart = 0;
      initiatorType = "";
      name = "";
      nextHopProtocol = "";
      redirectEnd = 0;
      redirectStart = 0;
      requestStart = 0;
      responseEnd = 0;
      responseStart = 0;
      secureConnectionStart = 0;
      startTime = 0;
      transferSize = 0;
      workerStart = 0;
      responseStatus = 0;
    };
    PerformanceObserverEntryList = class {
      static {
        __name(this, "PerformanceObserverEntryList");
      }
      __unenv__ = true;
      getEntries() {
        return [];
      }
      getEntriesByName(_name, _type) {
        return [];
      }
      getEntriesByType(type) {
        return [];
      }
    };
    Performance = class {
      static {
        __name(this, "Performance");
      }
      __unenv__ = true;
      timeOrigin = _timeOrigin;
      eventCounts = /* @__PURE__ */ new Map();
      _entries = [];
      _resourceTimingBufferSize = 0;
      navigation = void 0;
      timing = void 0;
      timerify(_fn, _options) {
        throw createNotImplementedError("Performance.timerify");
      }
      get nodeTiming() {
        return nodeTiming;
      }
      eventLoopUtilization() {
        return {};
      }
      markResourceTiming() {
        return new PerformanceResourceTiming("");
      }
      onresourcetimingbufferfull = null;
      now() {
        if (this.timeOrigin === _timeOrigin) {
          return _performanceNow();
        }
        return Date.now() - this.timeOrigin;
      }
      clearMarks(markName) {
        this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
      }
      clearMeasures(measureName) {
        this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
      }
      clearResourceTimings() {
        this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
      }
      getEntries() {
        return this._entries;
      }
      getEntriesByName(name, type) {
        return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
      }
      getEntriesByType(type) {
        return this._entries.filter((e) => e.entryType === type);
      }
      mark(name, options) {
        const entry = new PerformanceMark(name, options);
        this._entries.push(entry);
        return entry;
      }
      measure(measureName, startOrMeasureOptions, endMark) {
        let start;
        let end;
        if (typeof startOrMeasureOptions === "string") {
          start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
          end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
        } else {
          start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
          end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
        }
        const entry = new PerformanceMeasure(measureName, {
          startTime: start,
          detail: {
            start,
            end
          }
        });
        this._entries.push(entry);
        return entry;
      }
      setResourceTimingBufferSize(maxSize) {
        this._resourceTimingBufferSize = maxSize;
      }
      addEventListener(type, listener, options) {
        throw createNotImplementedError("Performance.addEventListener");
      }
      removeEventListener(type, listener, options) {
        throw createNotImplementedError("Performance.removeEventListener");
      }
      dispatchEvent(event) {
        throw createNotImplementedError("Performance.dispatchEvent");
      }
      toJSON() {
        return this;
      }
    };
    PerformanceObserver = class {
      static {
        __name(this, "PerformanceObserver");
      }
      __unenv__ = true;
      static supportedEntryTypes = [];
      _callback = null;
      constructor(callback) {
        this._callback = callback;
      }
      takeRecords() {
        return [];
      }
      disconnect() {
        throw createNotImplementedError("PerformanceObserver.disconnect");
      }
      observe(options) {
        throw createNotImplementedError("PerformanceObserver.observe");
      }
      bind(fn) {
        return fn;
      }
      runInAsyncScope(fn, thisArg, ...args) {
        return fn.call(thisArg, ...args);
      }
      asyncId() {
        return 0;
      }
      triggerAsyncId() {
        return 0;
      }
      emitDestroy() {
        return this;
      }
    };
    performance2 = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();
  }
});

// node_modules/unenv/dist/runtime/node/perf_hooks.mjs
var init_perf_hooks = __esm({
  "node_modules/unenv/dist/runtime/node/perf_hooks.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_performance();
  }
});

// node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs
var init_performance2 = __esm({
  "node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs"() {
    init_perf_hooks();
    globalThis.performance = performance2;
    globalThis.Performance = Performance;
    globalThis.PerformanceEntry = PerformanceEntry;
    globalThis.PerformanceMark = PerformanceMark;
    globalThis.PerformanceMeasure = PerformanceMeasure;
    globalThis.PerformanceObserver = PerformanceObserver;
    globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
    globalThis.PerformanceResourceTiming = PerformanceResourceTiming;
  }
});

// node_modules/unenv/dist/runtime/mock/noop.mjs
var noop_default;
var init_noop = __esm({
  "node_modules/unenv/dist/runtime/mock/noop.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    noop_default = Object.assign(() => {
    }, { __unenv__: true });
  }
});

// node_modules/unenv/dist/runtime/node/console.mjs
import { Writable } from "node:stream";
var _console, _ignoreErrors, _stderr, _stdout, log, info, trace, debug, table, error, warn, createTask, clear, count, countReset, dir, dirxml, group, groupEnd, groupCollapsed, profile, profileEnd, time, timeEnd, timeLog, timeStamp, Console, _times, _stdoutErrorHandler, _stderrErrorHandler;
var init_console = __esm({
  "node_modules/unenv/dist/runtime/node/console.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_noop();
    init_utils();
    _console = globalThis.console;
    _ignoreErrors = true;
    _stderr = new Writable();
    _stdout = new Writable();
    log = _console?.log ?? noop_default;
    info = _console?.info ?? log;
    trace = _console?.trace ?? info;
    debug = _console?.debug ?? log;
    table = _console?.table ?? log;
    error = _console?.error ?? log;
    warn = _console?.warn ?? error;
    createTask = _console?.createTask ?? /* @__PURE__ */ notImplemented("console.createTask");
    clear = _console?.clear ?? noop_default;
    count = _console?.count ?? noop_default;
    countReset = _console?.countReset ?? noop_default;
    dir = _console?.dir ?? noop_default;
    dirxml = _console?.dirxml ?? noop_default;
    group = _console?.group ?? noop_default;
    groupEnd = _console?.groupEnd ?? noop_default;
    groupCollapsed = _console?.groupCollapsed ?? noop_default;
    profile = _console?.profile ?? noop_default;
    profileEnd = _console?.profileEnd ?? noop_default;
    time = _console?.time ?? noop_default;
    timeEnd = _console?.timeEnd ?? noop_default;
    timeLog = _console?.timeLog ?? noop_default;
    timeStamp = _console?.timeStamp ?? noop_default;
    Console = _console?.Console ?? /* @__PURE__ */ notImplementedClass("console.Console");
    _times = /* @__PURE__ */ new Map();
    _stdoutErrorHandler = noop_default;
    _stderrErrorHandler = noop_default;
  }
});

// node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs
var workerdConsole, assert, clear2, context, count2, countReset2, createTask2, debug2, dir2, dirxml2, error2, group2, groupCollapsed2, groupEnd2, info2, log2, profile2, profileEnd2, table2, time2, timeEnd2, timeLog2, timeStamp2, trace2, warn2, console_default;
var init_console2 = __esm({
  "node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_console();
    workerdConsole = globalThis["console"];
    ({
      assert,
      clear: clear2,
      context: (
        // @ts-expect-error undocumented public API
        context
      ),
      count: count2,
      countReset: countReset2,
      createTask: (
        // @ts-expect-error undocumented public API
        createTask2
      ),
      debug: debug2,
      dir: dir2,
      dirxml: dirxml2,
      error: error2,
      group: group2,
      groupCollapsed: groupCollapsed2,
      groupEnd: groupEnd2,
      info: info2,
      log: log2,
      profile: profile2,
      profileEnd: profileEnd2,
      table: table2,
      time: time2,
      timeEnd: timeEnd2,
      timeLog: timeLog2,
      timeStamp: timeStamp2,
      trace: trace2,
      warn: warn2
    } = workerdConsole);
    Object.assign(workerdConsole, {
      Console,
      _ignoreErrors,
      _stderr,
      _stderrErrorHandler,
      _stdout,
      _stdoutErrorHandler,
      _times
    });
    console_default = workerdConsole;
  }
});

// node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console
var init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console = __esm({
  "node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console"() {
    init_console2();
    globalThis.console = console_default;
  }
});

// node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs
var hrtime;
var init_hrtime = __esm({
  "node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name(function hrtime2(startTime) {
      const now = Date.now();
      const seconds = Math.trunc(now / 1e3);
      const nanos = now % 1e3 * 1e6;
      if (startTime) {
        let diffSeconds = seconds - startTime[0];
        let diffNanos = nanos - startTime[0];
        if (diffNanos < 0) {
          diffSeconds = diffSeconds - 1;
          diffNanos = 1e9 + diffNanos;
        }
        return [diffSeconds, diffNanos];
      }
      return [seconds, nanos];
    }, "hrtime"), { bigint: /* @__PURE__ */ __name(function bigint() {
      return BigInt(Date.now() * 1e6);
    }, "bigint") });
  }
});

// node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs
var WriteStream;
var init_write_stream = __esm({
  "node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    WriteStream = class {
      static {
        __name(this, "WriteStream");
      }
      fd;
      columns = 80;
      rows = 24;
      isTTY = false;
      constructor(fd) {
        this.fd = fd;
      }
      clearLine(dir3, callback) {
        callback && callback();
        return false;
      }
      clearScreenDown(callback) {
        callback && callback();
        return false;
      }
      cursorTo(x, y, callback) {
        callback && typeof callback === "function" && callback();
        return false;
      }
      moveCursor(dx, dy, callback) {
        callback && callback();
        return false;
      }
      getColorDepth(env2) {
        return 1;
      }
      hasColors(count3, env2) {
        return false;
      }
      getWindowSize() {
        return [this.columns, this.rows];
      }
      write(str, encoding, cb) {
        if (str instanceof Uint8Array) {
          str = new TextDecoder().decode(str);
        }
        try {
          console.log(str);
        } catch {
        }
        cb && typeof cb === "function" && cb();
        return false;
      }
    };
  }
});

// node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs
var ReadStream;
var init_read_stream = __esm({
  "node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    ReadStream = class {
      static {
        __name(this, "ReadStream");
      }
      fd;
      isRaw = false;
      isTTY = false;
      constructor(fd) {
        this.fd = fd;
      }
      setRawMode(mode) {
        this.isRaw = mode;
        return this;
      }
    };
  }
});

// node_modules/unenv/dist/runtime/node/tty.mjs
var init_tty = __esm({
  "node_modules/unenv/dist/runtime/node/tty.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_read_stream();
    init_write_stream();
  }
});

// node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs
var NODE_VERSION;
var init_node_version = __esm({
  "node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    NODE_VERSION = "22.14.0";
  }
});

// node_modules/unenv/dist/runtime/node/internal/process/process.mjs
import { EventEmitter } from "node:events";
var Process;
var init_process = __esm({
  "node_modules/unenv/dist/runtime/node/internal/process/process.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_tty();
    init_utils();
    init_node_version();
    Process = class _Process extends EventEmitter {
      static {
        __name(this, "Process");
      }
      env;
      hrtime;
      nextTick;
      constructor(impl) {
        super();
        this.env = impl.env;
        this.hrtime = impl.hrtime;
        this.nextTick = impl.nextTick;
        for (const prop of [...Object.getOwnPropertyNames(_Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
          const value = this[prop];
          if (typeof value === "function") {
            this[prop] = value.bind(this);
          }
        }
      }
      // --- event emitter ---
      emitWarning(warning, type, code) {
        console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
      }
      emit(...args) {
        return super.emit(...args);
      }
      listeners(eventName) {
        return super.listeners(eventName);
      }
      // --- stdio (lazy initializers) ---
      #stdin;
      #stdout;
      #stderr;
      get stdin() {
        return this.#stdin ??= new ReadStream(0);
      }
      get stdout() {
        return this.#stdout ??= new WriteStream(1);
      }
      get stderr() {
        return this.#stderr ??= new WriteStream(2);
      }
      // --- cwd ---
      #cwd = "/";
      chdir(cwd2) {
        this.#cwd = cwd2;
      }
      cwd() {
        return this.#cwd;
      }
      // --- dummy props and getters ---
      arch = "";
      platform = "";
      argv = [];
      argv0 = "";
      execArgv = [];
      execPath = "";
      title = "";
      pid = 200;
      ppid = 100;
      get version() {
        return `v${NODE_VERSION}`;
      }
      get versions() {
        return { node: NODE_VERSION };
      }
      get allowedNodeEnvironmentFlags() {
        return /* @__PURE__ */ new Set();
      }
      get sourceMapsEnabled() {
        return false;
      }
      get debugPort() {
        return 0;
      }
      get throwDeprecation() {
        return false;
      }
      get traceDeprecation() {
        return false;
      }
      get features() {
        return {};
      }
      get release() {
        return {};
      }
      get connected() {
        return false;
      }
      get config() {
        return {};
      }
      get moduleLoadList() {
        return [];
      }
      constrainedMemory() {
        return 0;
      }
      availableMemory() {
        return 0;
      }
      uptime() {
        return 0;
      }
      resourceUsage() {
        return {};
      }
      // --- noop methods ---
      ref() {
      }
      unref() {
      }
      // --- unimplemented methods ---
      umask() {
        throw createNotImplementedError("process.umask");
      }
      getBuiltinModule() {
        return void 0;
      }
      getActiveResourcesInfo() {
        throw createNotImplementedError("process.getActiveResourcesInfo");
      }
      exit() {
        throw createNotImplementedError("process.exit");
      }
      reallyExit() {
        throw createNotImplementedError("process.reallyExit");
      }
      kill() {
        throw createNotImplementedError("process.kill");
      }
      abort() {
        throw createNotImplementedError("process.abort");
      }
      dlopen() {
        throw createNotImplementedError("process.dlopen");
      }
      setSourceMapsEnabled() {
        throw createNotImplementedError("process.setSourceMapsEnabled");
      }
      loadEnvFile() {
        throw createNotImplementedError("process.loadEnvFile");
      }
      disconnect() {
        throw createNotImplementedError("process.disconnect");
      }
      cpuUsage() {
        throw createNotImplementedError("process.cpuUsage");
      }
      setUncaughtExceptionCaptureCallback() {
        throw createNotImplementedError("process.setUncaughtExceptionCaptureCallback");
      }
      hasUncaughtExceptionCaptureCallback() {
        throw createNotImplementedError("process.hasUncaughtExceptionCaptureCallback");
      }
      initgroups() {
        throw createNotImplementedError("process.initgroups");
      }
      openStdin() {
        throw createNotImplementedError("process.openStdin");
      }
      assert() {
        throw createNotImplementedError("process.assert");
      }
      binding() {
        throw createNotImplementedError("process.binding");
      }
      // --- attached interfaces ---
      permission = { has: /* @__PURE__ */ notImplemented("process.permission.has") };
      report = {
        directory: "",
        filename: "",
        signal: "SIGUSR2",
        compact: false,
        reportOnFatalError: false,
        reportOnSignal: false,
        reportOnUncaughtException: false,
        getReport: /* @__PURE__ */ notImplemented("process.report.getReport"),
        writeReport: /* @__PURE__ */ notImplemented("process.report.writeReport")
      };
      finalization = {
        register: /* @__PURE__ */ notImplemented("process.finalization.register"),
        unregister: /* @__PURE__ */ notImplemented("process.finalization.unregister"),
        registerBeforeExit: /* @__PURE__ */ notImplemented("process.finalization.registerBeforeExit")
      };
      memoryUsage = Object.assign(() => ({
        arrayBuffers: 0,
        rss: 0,
        external: 0,
        heapTotal: 0,
        heapUsed: 0
      }), { rss: /* @__PURE__ */ __name(() => 0, "rss") });
      // --- undefined props ---
      mainModule = void 0;
      domain = void 0;
      // optional
      send = void 0;
      exitCode = void 0;
      channel = void 0;
      getegid = void 0;
      geteuid = void 0;
      getgid = void 0;
      getgroups = void 0;
      getuid = void 0;
      setegid = void 0;
      seteuid = void 0;
      setgid = void 0;
      setgroups = void 0;
      setuid = void 0;
      // internals
      _events = void 0;
      _eventsCount = void 0;
      _exiting = void 0;
      _maxListeners = void 0;
      _debugEnd = void 0;
      _debugProcess = void 0;
      _fatalException = void 0;
      _getActiveHandles = void 0;
      _getActiveRequests = void 0;
      _kill = void 0;
      _preload_modules = void 0;
      _rawDebug = void 0;
      _startProfilerIdleNotifier = void 0;
      _stopProfilerIdleNotifier = void 0;
      _tickCallback = void 0;
      _disconnect = void 0;
      _handleQueue = void 0;
      _pendingMessage = void 0;
      _channel = void 0;
      _send = void 0;
      _linkedBinding = void 0;
    };
  }
});

// node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs
var globalProcess, getBuiltinModule, exit, platform, nextTick, unenvProcess, abort, addListener, allowedNodeEnvironmentFlags, hasUncaughtExceptionCaptureCallback, setUncaughtExceptionCaptureCallback, loadEnvFile, sourceMapsEnabled, arch, argv, argv0, chdir, config, connected, constrainedMemory, availableMemory, cpuUsage, cwd, debugPort, dlopen, disconnect, emit, emitWarning, env, eventNames, execArgv, execPath, finalization, features, getActiveResourcesInfo, getMaxListeners, hrtime3, kill, listeners, listenerCount, memoryUsage, on, off, once, pid, ppid, prependListener, prependOnceListener, rawListeners, release, removeAllListeners, removeListener, report, resourceUsage, setMaxListeners, setSourceMapsEnabled, stderr, stdin, stdout, title, throwDeprecation, traceDeprecation, umask, uptime, version, versions, domain, initgroups, moduleLoadList, reallyExit, openStdin, assert2, binding, send, exitCode, channel, getegid, geteuid, getgid, getgroups, getuid, setegid, seteuid, setgid, setgroups, setuid, permission, mainModule, _events, _eventsCount, _exiting, _maxListeners, _debugEnd, _debugProcess, _fatalException, _getActiveHandles, _getActiveRequests, _kill, _preload_modules, _rawDebug, _startProfilerIdleNotifier, _stopProfilerIdleNotifier, _tickCallback, _disconnect, _handleQueue, _pendingMessage, _channel, _send, _linkedBinding, _process, process_default;
var init_process2 = __esm({
  "node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_hrtime();
    init_process();
    globalProcess = globalThis["process"];
    getBuiltinModule = globalProcess.getBuiltinModule;
    ({ exit, platform, nextTick } = getBuiltinModule(
      "node:process"
    ));
    unenvProcess = new Process({
      env: globalProcess.env,
      hrtime,
      nextTick
    });
    ({
      abort,
      addListener,
      allowedNodeEnvironmentFlags,
      hasUncaughtExceptionCaptureCallback,
      setUncaughtExceptionCaptureCallback,
      loadEnvFile,
      sourceMapsEnabled,
      arch,
      argv,
      argv0,
      chdir,
      config,
      connected,
      constrainedMemory,
      availableMemory,
      cpuUsage,
      cwd,
      debugPort,
      dlopen,
      disconnect,
      emit,
      emitWarning,
      env,
      eventNames,
      execArgv,
      execPath,
      finalization,
      features,
      getActiveResourcesInfo,
      getMaxListeners,
      hrtime: hrtime3,
      kill,
      listeners,
      listenerCount,
      memoryUsage,
      on,
      off,
      once,
      pid,
      ppid,
      prependListener,
      prependOnceListener,
      rawListeners,
      release,
      removeAllListeners,
      removeListener,
      report,
      resourceUsage,
      setMaxListeners,
      setSourceMapsEnabled,
      stderr,
      stdin,
      stdout,
      title,
      throwDeprecation,
      traceDeprecation,
      umask,
      uptime,
      version,
      versions,
      domain,
      initgroups,
      moduleLoadList,
      reallyExit,
      openStdin,
      assert: assert2,
      binding,
      send,
      exitCode,
      channel,
      getegid,
      geteuid,
      getgid,
      getgroups,
      getuid,
      setegid,
      seteuid,
      setgid,
      setgroups,
      setuid,
      permission,
      mainModule,
      _events,
      _eventsCount,
      _exiting,
      _maxListeners,
      _debugEnd,
      _debugProcess,
      _fatalException,
      _getActiveHandles,
      _getActiveRequests,
      _kill,
      _preload_modules,
      _rawDebug,
      _startProfilerIdleNotifier,
      _stopProfilerIdleNotifier,
      _tickCallback,
      _disconnect,
      _handleQueue,
      _pendingMessage,
      _channel,
      _send,
      _linkedBinding
    } = unenvProcess);
    _process = {
      abort,
      addListener,
      allowedNodeEnvironmentFlags,
      hasUncaughtExceptionCaptureCallback,
      setUncaughtExceptionCaptureCallback,
      loadEnvFile,
      sourceMapsEnabled,
      arch,
      argv,
      argv0,
      chdir,
      config,
      connected,
      constrainedMemory,
      availableMemory,
      cpuUsage,
      cwd,
      debugPort,
      dlopen,
      disconnect,
      emit,
      emitWarning,
      env,
      eventNames,
      execArgv,
      execPath,
      exit,
      finalization,
      features,
      getBuiltinModule,
      getActiveResourcesInfo,
      getMaxListeners,
      hrtime: hrtime3,
      kill,
      listeners,
      listenerCount,
      memoryUsage,
      nextTick,
      on,
      off,
      once,
      pid,
      platform,
      ppid,
      prependListener,
      prependOnceListener,
      rawListeners,
      release,
      removeAllListeners,
      removeListener,
      report,
      resourceUsage,
      setMaxListeners,
      setSourceMapsEnabled,
      stderr,
      stdin,
      stdout,
      title,
      throwDeprecation,
      traceDeprecation,
      umask,
      uptime,
      version,
      versions,
      // @ts-expect-error old API
      domain,
      initgroups,
      moduleLoadList,
      reallyExit,
      openStdin,
      assert: assert2,
      binding,
      send,
      exitCode,
      channel,
      getegid,
      geteuid,
      getgid,
      getgroups,
      getuid,
      setegid,
      seteuid,
      setgid,
      setgroups,
      setuid,
      permission,
      mainModule,
      _events,
      _eventsCount,
      _exiting,
      _maxListeners,
      _debugEnd,
      _debugProcess,
      _fatalException,
      _getActiveHandles,
      _getActiveRequests,
      _kill,
      _preload_modules,
      _rawDebug,
      _startProfilerIdleNotifier,
      _stopProfilerIdleNotifier,
      _tickCallback,
      _disconnect,
      _handleQueue,
      _pendingMessage,
      _channel,
      _send,
      _linkedBinding
    };
    process_default = _process;
  }
});

// node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process
var init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process = __esm({
  "node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process"() {
    init_process2();
    globalThis.process = process_default;
  }
});

// wrangler-modules-watch:wrangler:modules-watch
var init_wrangler_modules_watch = __esm({
  "wrangler-modules-watch:wrangler:modules-watch"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
  }
});

// node_modules/wrangler/templates/modules-watch-stub.js
var init_modules_watch_stub = __esm({
  "node_modules/wrangler/templates/modules-watch-stub.js"() {
    init_wrangler_modules_watch();
  }
});

// dist/_worker.js/renderers.mjs
var renderers;
var init_renderers = __esm({
  "dist/_worker.js/renderers.mjs"() {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    globalThis.process ??= {};
    globalThis.process.env ??= {};
    renderers = [];
  }
});

// dist/_worker.js/chunks/astro/server_BRKsKzpO.mjs
function normalizeLF(code) {
  return code.replace(/\r\n|\r(?!\n)|\n/g, "\n");
}
function codeFrame(src, loc) {
  if (!loc || loc.line === void 0 || loc.column === void 0) {
    return "";
  }
  const lines = normalizeLF(src).split("\n").map((ln) => ln.replace(/\t/g, "  "));
  const visibleLines = [];
  for (let n = -2; n <= 2; n++) {
    if (lines[loc.line + n]) visibleLines.push(loc.line + n);
  }
  let gutterWidth = 0;
  for (const lineNo of visibleLines) {
    let w = `> ${lineNo}`;
    if (w.length > gutterWidth) gutterWidth = w.length;
  }
  let output = "";
  for (const lineNo of visibleLines) {
    const isFocusedLine = lineNo === loc.line - 1;
    output += isFocusedLine ? "> " : "  ";
    output += `${lineNo + 1} | ${lines[lineNo]}
`;
    if (isFocusedLine)
      output += `${Array.from({ length: gutterWidth }).join(" ")}  | ${Array.from({
        length: loc.column
      }).join(" ")}^
`;
  }
  return output;
}
function validateArgs(args) {
  if (args.length !== 3) return false;
  if (!args[0] || typeof args[0] !== "object") return false;
  return true;
}
function baseCreateComponent(cb, moduleId, propagation) {
  const name = moduleId?.split("/").pop()?.replace(".astro", "") ?? "";
  const fn = /* @__PURE__ */ __name((...args) => {
    if (!validateArgs(args)) {
      throw new AstroError({
        ...InvalidComponentArgs,
        message: InvalidComponentArgs.message(name)
      });
    }
    return cb(...args);
  }, "fn");
  Object.defineProperty(fn, "name", { value: name, writable: false });
  fn.isAstroComponentFactory = true;
  fn.moduleId = moduleId;
  fn.propagation = propagation;
  return fn;
}
function createComponentWithOptions(opts) {
  const cb = baseCreateComponent(opts.factory, opts.moduleId, opts.propagation);
  return cb;
}
function createComponent(arg1, moduleId, propagation) {
  if (typeof arg1 === "function") {
    return baseCreateComponent(arg1, moduleId, propagation);
  } else {
    return createComponentWithOptions(arg1);
  }
}
function createAstroGlobFn() {
  const globHandler = /* @__PURE__ */ __name((importMetaGlobResult) => {
    console.warn(`Astro.glob is deprecated and will be removed in a future major version of Astro.
Use import.meta.glob instead: https://vitejs.dev/guide/features.html#glob-import`);
    if (typeof importMetaGlobResult === "string") {
      throw new AstroError({
        ...AstroGlobUsedOutside,
        message: AstroGlobUsedOutside.message(JSON.stringify(importMetaGlobResult))
      });
    }
    let allEntries = [...Object.values(importMetaGlobResult)];
    if (allEntries.length === 0) {
      throw new AstroError({
        ...AstroGlobNoMatch,
        message: AstroGlobNoMatch.message(JSON.stringify(importMetaGlobResult))
      });
    }
    return Promise.all(allEntries.map((fn) => fn()));
  }, "globHandler");
  return globHandler;
}
function createAstro(site) {
  return {
    // TODO: this is no longer necessary for `Astro.site`
    // but it somehow allows working around caching issues in content collections for some tests
    site: void 0,
    generator: `Astro v${ASTRO_VERSION}`,
    glob: createAstroGlobFn()
  };
}
function init(x, y) {
  let rgx = new RegExp(`\\x1b\\[${y}m`, "g");
  let open2 = `\x1B[${x}m`, close = `\x1B[${y}m`;
  return function(txt) {
    if (!$.enabled || txt == null) return txt;
    return open2 + (!!~("" + txt).indexOf(close) ? txt.replace(rgx, close + open2) : txt) + close;
  };
}
async function renderEndpoint(mod, context2, isPrerendered, logger) {
  const { request, url } = context2;
  const method = request.method.toUpperCase();
  let handler = mod[method] ?? mod["ALL"];
  if (!handler && method === "HEAD" && mod["GET"]) {
    handler = mod["GET"];
  }
  if (isPrerendered && !["GET", "HEAD"].includes(method)) {
    logger.warn(
      "router",
      `${url.pathname} ${bold(
        method
      )} requests are not available in static endpoints. Mark this page as server-rendered (\`export const prerender = false;\`) or update your config to \`output: 'server'\` to make all your pages server-rendered by default.`
    );
  }
  if (handler === void 0) {
    logger.warn(
      "router",
      `No API Route handler exists for the method "${method}" for the route "${url.pathname}".
Found handlers: ${Object.keys(mod).map((exp) => JSON.stringify(exp)).join(", ")}
` + ("all" in mod ? `One of the exported handlers is "all" (lowercase), did you mean to export 'ALL'?
` : "")
    );
    return new Response(null, { status: 404 });
  }
  if (typeof handler !== "function") {
    logger.error(
      "router",
      `The route "${url.pathname}" exports a value for the method "${method}", but it is of the type ${typeof handler} instead of a function.`
    );
    return new Response(null, { status: 500 });
  }
  let response = await handler.call(mod, context2);
  if (!response || response instanceof Response === false) {
    throw new AstroError(EndpointDidNotReturnAResponse);
  }
  if (REROUTABLE_STATUS_CODES.includes(response.status)) {
    try {
      response.headers.set(REROUTE_DIRECTIVE_HEADER, "no");
    } catch (err) {
      if (err.message?.includes("immutable")) {
        response = new Response(response.body, response);
        response.headers.set(REROUTE_DIRECTIVE_HEADER, "no");
      } else {
        throw err;
      }
    }
  }
  if (method === "HEAD") {
    return new Response(null, response);
  }
  return response;
}
function isPromise(value) {
  return !!value && typeof value === "object" && "then" in value && typeof value.then === "function";
}
async function* streamAsyncIterator(stream) {
  const reader = stream.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) return;
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}
function isHTMLString(value) {
  return Object.prototype.toString.call(value) === "[object HTMLString]";
}
function markHTMLBytes(bytes) {
  return new HTMLBytes(bytes);
}
function hasGetReader(obj) {
  return typeof obj.getReader === "function";
}
async function* unescapeChunksAsync(iterable) {
  if (hasGetReader(iterable)) {
    for await (const chunk of streamAsyncIterator(iterable)) {
      yield unescapeHTML(chunk);
    }
  } else {
    for await (const chunk of iterable) {
      yield unescapeHTML(chunk);
    }
  }
}
function* unescapeChunks(iterable) {
  for (const chunk of iterable) {
    yield unescapeHTML(chunk);
  }
}
function unescapeHTML(str) {
  if (!!str && typeof str === "object") {
    if (str instanceof Uint8Array) {
      return markHTMLBytes(str);
    } else if (str instanceof Response && str.body) {
      const body = str.body;
      return unescapeChunksAsync(body);
    } else if (typeof str.then === "function") {
      return Promise.resolve(str).then((value) => {
        return unescapeHTML(value);
      });
    } else if (str[Symbol.for("astro:slot-string")]) {
      return str;
    } else if (Symbol.iterator in str) {
      return unescapeChunks(str);
    } else if (Symbol.asyncIterator in str || hasGetReader(str)) {
      return unescapeChunksAsync(str);
    }
  }
  return markHTMLString(str);
}
function isVNode(vnode) {
  return vnode && typeof vnode === "object" && vnode[AstroJSX];
}
function isAstroComponentFactory(obj) {
  return obj == null ? false : obj.isAstroComponentFactory === true;
}
function isAPropagatingComponent(result, factory) {
  const hint = getPropagationHint(result, factory);
  return hint === "in-tree" || hint === "self";
}
function getPropagationHint(result, factory) {
  let hint = factory.propagation || "none";
  if (factory.moduleId && result.componentMetadata.has(factory.moduleId) && hint === "none") {
    hint = result.componentMetadata.get(factory.moduleId).propagation;
  }
  return hint;
}
function r(e) {
  var t, f, n = "";
  if ("string" == typeof e || "number" == typeof e) n += e;
  else if ("object" == typeof e) if (Array.isArray(e)) {
    var o = e.length;
    for (t = 0; t < o; t++) e[t] && (f = r(e[t])) && (n && (n += " "), n += f);
  } else for (f in e) e[f] && (n && (n += " "), n += f);
  return n;
}
function clsx() {
  for (var e, t, f = 0, n = "", o = arguments.length; f < o; f++) (e = arguments[f]) && (t = r(e)) && (n && (n += " "), n += t);
  return n;
}
function serializeArray(value, metadata = {}, parents = /* @__PURE__ */ new WeakSet()) {
  if (parents.has(value)) {
    throw new Error(`Cyclic reference detected while serializing props for <${metadata.displayName} client:${metadata.hydrate}>!

Cyclic references cannot be safely serialized for client-side usage. Please remove the cyclic reference.`);
  }
  parents.add(value);
  const serialized = value.map((v) => {
    return convertToSerializedForm(v, metadata, parents);
  });
  parents.delete(value);
  return serialized;
}
function serializeObject(value, metadata = {}, parents = /* @__PURE__ */ new WeakSet()) {
  if (parents.has(value)) {
    throw new Error(`Cyclic reference detected while serializing props for <${metadata.displayName} client:${metadata.hydrate}>!

Cyclic references cannot be safely serialized for client-side usage. Please remove the cyclic reference.`);
  }
  parents.add(value);
  const serialized = Object.fromEntries(
    Object.entries(value).map(([k, v]) => {
      return [k, convertToSerializedForm(v, metadata, parents)];
    })
  );
  parents.delete(value);
  return serialized;
}
function convertToSerializedForm(value, metadata = {}, parents = /* @__PURE__ */ new WeakSet()) {
  const tag = Object.prototype.toString.call(value);
  switch (tag) {
    case "[object Date]": {
      return [PROP_TYPE.Date, value.toISOString()];
    }
    case "[object RegExp]": {
      return [PROP_TYPE.RegExp, value.source];
    }
    case "[object Map]": {
      return [PROP_TYPE.Map, serializeArray(Array.from(value), metadata, parents)];
    }
    case "[object Set]": {
      return [PROP_TYPE.Set, serializeArray(Array.from(value), metadata, parents)];
    }
    case "[object BigInt]": {
      return [PROP_TYPE.BigInt, value.toString()];
    }
    case "[object URL]": {
      return [PROP_TYPE.URL, value.toString()];
    }
    case "[object Array]": {
      return [PROP_TYPE.JSON, serializeArray(value, metadata, parents)];
    }
    case "[object Uint8Array]": {
      return [PROP_TYPE.Uint8Array, Array.from(value)];
    }
    case "[object Uint16Array]": {
      return [PROP_TYPE.Uint16Array, Array.from(value)];
    }
    case "[object Uint32Array]": {
      return [PROP_TYPE.Uint32Array, Array.from(value)];
    }
    default: {
      if (value !== null && typeof value === "object") {
        return [PROP_TYPE.Value, serializeObject(value, metadata, parents)];
      }
      if (value === Infinity) {
        return [PROP_TYPE.Infinity, 1];
      }
      if (value === -Infinity) {
        return [PROP_TYPE.Infinity, -1];
      }
      if (value === void 0) {
        return [PROP_TYPE.Value];
      }
      return [PROP_TYPE.Value, value];
    }
  }
}
function serializeProps(props, metadata) {
  const serialized = JSON.stringify(serializeObject(props, metadata));
  return serialized;
}
function extractDirectives(inputProps, clientDirectives) {
  let extracted = {
    isPage: false,
    hydration: null,
    props: {},
    propsWithoutTransitionAttributes: {}
  };
  for (const [key, value] of Object.entries(inputProps)) {
    if (key.startsWith("server:")) {
      if (key === "server:root") {
        extracted.isPage = true;
      }
    }
    if (key.startsWith("client:")) {
      if (!extracted.hydration) {
        extracted.hydration = {
          directive: "",
          value: "",
          componentUrl: "",
          componentExport: { value: "" }
        };
      }
      switch (key) {
        case "client:component-path": {
          extracted.hydration.componentUrl = value;
          break;
        }
        case "client:component-export": {
          extracted.hydration.componentExport.value = value;
          break;
        }
        // This is a special prop added to prove that the client hydration method
        // was added statically.
        case "client:component-hydration": {
          break;
        }
        case "client:display-name": {
          break;
        }
        default: {
          extracted.hydration.directive = key.split(":")[1];
          extracted.hydration.value = value;
          if (!clientDirectives.has(extracted.hydration.directive)) {
            const hydrationMethods = Array.from(clientDirectives.keys()).map((d) => `client:${d}`).join(", ");
            throw new Error(
              `Error: invalid hydration directive "${key}". Supported hydration methods: ${hydrationMethods}`
            );
          }
          if (extracted.hydration.directive === "media" && typeof extracted.hydration.value !== "string") {
            throw new AstroError(MissingMediaQueryDirective);
          }
          break;
        }
      }
    } else {
      extracted.props[key] = value;
      if (!transitionDirectivesToCopyOnIsland.includes(key)) {
        extracted.propsWithoutTransitionAttributes[key] = value;
      }
    }
  }
  for (const sym of Object.getOwnPropertySymbols(inputProps)) {
    extracted.props[sym] = inputProps[sym];
    extracted.propsWithoutTransitionAttributes[sym] = inputProps[sym];
  }
  return extracted;
}
async function generateHydrateScript(scriptOptions, metadata) {
  const { renderer, result, astroId, props, attrs } = scriptOptions;
  const { hydrate, componentUrl, componentExport } = metadata;
  if (!componentExport.value) {
    throw new AstroError({
      ...NoMatchingImport,
      message: NoMatchingImport.message(metadata.displayName)
    });
  }
  const island = {
    children: "",
    props: {
      // This is for HMR, probably can avoid it in prod
      uid: astroId
    }
  };
  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      island.props[key] = escapeHTML(value);
    }
  }
  island.props["component-url"] = await result.resolve(decodeURI(componentUrl));
  if (renderer.clientEntrypoint) {
    island.props["component-export"] = componentExport.value;
    island.props["renderer-url"] = await result.resolve(
      decodeURI(renderer.clientEntrypoint.toString())
    );
    island.props["props"] = escapeHTML(serializeProps(props, metadata));
  }
  island.props["ssr"] = "";
  island.props["client"] = hydrate;
  let beforeHydrationUrl = await result.resolve("astro:scripts/before-hydration.js");
  if (beforeHydrationUrl.length) {
    island.props["before-hydration-url"] = beforeHydrationUrl;
  }
  island.props["opts"] = escapeHTML(
    JSON.stringify({
      name: metadata.displayName,
      value: metadata.hydrateArgs || ""
    })
  );
  transitionDirectivesToCopyOnIsland.forEach((name) => {
    if (typeof props[name] !== "undefined") {
      island.props[name] = props[name];
    }
  });
  return island;
}
function bitwise(str) {
  let hash = 0;
  if (str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    hash = (hash << 5) - hash + ch;
    hash = hash & hash;
  }
  return hash;
}
function shorthash(text) {
  let num;
  let result = "";
  let integer = bitwise(text);
  const sign = integer < 0 ? "Z" : "";
  integer = Math.abs(integer);
  while (integer >= binary) {
    num = integer % binary;
    integer = Math.floor(integer / binary);
    result = dictionary[num] + result;
  }
  if (integer > 0) {
    result = dictionary[integer] + result;
  }
  return sign + result;
}
function isHeadAndContent(obj) {
  return typeof obj === "object" && obj !== null && !!obj[headAndContentSym];
}
function createThinHead() {
  return {
    [headAndContentSym]: true
  };
}
function determineIfNeedsHydrationScript(result) {
  if (result._metadata.hasHydrationScript) {
    return false;
  }
  return result._metadata.hasHydrationScript = true;
}
function determinesIfNeedsDirectiveScript(result, directive) {
  if (result._metadata.hasDirectives.has(directive)) {
    return false;
  }
  result._metadata.hasDirectives.add(directive);
  return true;
}
function getDirectiveScriptText(result, directive) {
  const clientDirectives = result.clientDirectives;
  const clientDirective = clientDirectives.get(directive);
  if (!clientDirective) {
    throw new Error(`Unknown directive: ${directive}`);
  }
  return clientDirective;
}
function getPrescripts(result, type, directive) {
  switch (type) {
    case "both":
      return `<style>${ISLAND_STYLES}</style><script>${getDirectiveScriptText(result, directive)}<\/script><script>${astro_island_prebuilt_default}<\/script>`;
    case "directive":
      return `<script>${getDirectiveScriptText(result, directive)}<\/script>`;
  }
}
function renderCspContent(result) {
  const finalScriptHashes = /* @__PURE__ */ new Set();
  const finalStyleHashes = /* @__PURE__ */ new Set();
  for (const scriptHash of result.scriptHashes) {
    finalScriptHashes.add(`'${scriptHash}'`);
  }
  for (const styleHash of result.styleHashes) {
    finalStyleHashes.add(`'${styleHash}'`);
  }
  for (const styleHash of result._metadata.extraStyleHashes) {
    finalStyleHashes.add(`'${styleHash}'`);
  }
  for (const scriptHash of result._metadata.extraScriptHashes) {
    finalScriptHashes.add(`'${scriptHash}'`);
  }
  let directives = "";
  if (result.directives.length > 0) {
    directives = result.directives.join(";") + ";";
  }
  let scriptResources = "'self'";
  if (result.scriptResources.length > 0) {
    scriptResources = result.scriptResources.map((r2) => `${r2}`).join(" ");
  }
  let styleResources = "'self'";
  if (result.styleResources.length > 0) {
    styleResources = result.styleResources.map((r2) => `${r2}`).join(" ");
  }
  const strictDynamic = result.isStrictDynamic ? ` 'strict-dynamic'` : "";
  const scriptSrc = `script-src ${scriptResources} ${Array.from(finalScriptHashes).join(" ")}${strictDynamic};`;
  const styleSrc = `style-src ${styleResources} ${Array.from(finalStyleHashes).join(" ")};`;
  return `${directives} ${scriptSrc} ${styleSrc}`;
}
function createRenderInstruction(instruction) {
  return Object.defineProperty(instruction, RenderInstructionSymbol, {
    value: true
  });
}
function isRenderInstruction(chunk) {
  return chunk && typeof chunk === "object" && chunk[RenderInstructionSymbol];
}
function defineScriptVars(vars) {
  let output = "";
  for (const [key, value] of Object.entries(vars)) {
    output += `const ${toIdent(key)} = ${JSON.stringify(value)?.replace(
      /<\/script>/g,
      "\\x3C/script>"
    )};
`;
  }
  return markHTMLString(output);
}
function formatList(values) {
  if (values.length === 1) {
    return values[0];
  }
  return `${values.slice(0, -1).join(", ")} or ${values[values.length - 1]}`;
}
function isCustomElement(tagName) {
  return tagName.includes("-");
}
function handleBooleanAttribute(key, value, shouldEscape, tagName) {
  if (tagName && isCustomElement(tagName)) {
    return markHTMLString(` ${key}="${toAttributeString(value, shouldEscape)}"`);
  }
  return markHTMLString(value ? ` ${key}` : "");
}
function addAttribute(value, key, shouldEscape = true, tagName = "") {
  if (value == null) {
    return "";
  }
  if (STATIC_DIRECTIVES.has(key)) {
    console.warn(`[astro] The "${key}" directive cannot be applied dynamically at runtime. It will not be rendered as an attribute.

Make sure to use the static attribute syntax (\`${key}={value}\`) instead of the dynamic spread syntax (\`{...{ "${key}": value }}\`).`);
    return "";
  }
  if (key === "class:list") {
    const listValue = toAttributeString(clsx(value), shouldEscape);
    if (listValue === "") {
      return "";
    }
    return markHTMLString(` ${key.slice(0, -5)}="${listValue}"`);
  }
  if (key === "style" && !(value instanceof HTMLString)) {
    if (Array.isArray(value) && value.length === 2) {
      return markHTMLString(
        ` ${key}="${toAttributeString(`${toStyleString(value[0])};${value[1]}`, shouldEscape)}"`
      );
    }
    if (typeof value === "object") {
      return markHTMLString(` ${key}="${toAttributeString(toStyleString(value), shouldEscape)}"`);
    }
  }
  if (key === "className") {
    return markHTMLString(` class="${toAttributeString(value, shouldEscape)}"`);
  }
  if (typeof value === "string" && value.includes("&") && isHttpUrl(value)) {
    return markHTMLString(` ${key}="${toAttributeString(value, false)}"`);
  }
  if (htmlBooleanAttributes.test(key)) {
    return handleBooleanAttribute(key, value, shouldEscape, tagName);
  }
  if (value === "") {
    return markHTMLString(` ${key}`);
  }
  if (key === "popover" && typeof value === "boolean") {
    return handleBooleanAttribute(key, value, shouldEscape, tagName);
  }
  if (key === "download" && typeof value === "boolean") {
    return handleBooleanAttribute(key, value, shouldEscape, tagName);
  }
  return markHTMLString(` ${key}="${toAttributeString(value, shouldEscape)}"`);
}
function internalSpreadAttributes(values, shouldEscape = true, tagName) {
  let output = "";
  for (const [key, value] of Object.entries(values)) {
    output += addAttribute(value, key, shouldEscape, tagName);
  }
  return markHTMLString(output);
}
function renderElement$1(name, { props: _props, children = "" }, shouldEscape = true) {
  const { lang: _, "data-astro-id": astroId, "define:vars": defineVars, ...props } = _props;
  if (defineVars) {
    if (name === "style") {
      delete props["is:global"];
      delete props["is:scoped"];
    }
    if (name === "script") {
      delete props.hoist;
      children = defineScriptVars(defineVars) + "\n" + children;
    }
  }
  if ((children == null || children == "") && voidElementNames.test(name)) {
    return `<${name}${internalSpreadAttributes(props, shouldEscape, name)}>`;
  }
  return `<${name}${internalSpreadAttributes(props, shouldEscape, name)}>${children}</${name}>`;
}
function createBufferedRenderer(destination, renderFunction) {
  return new BufferedRenderer(destination, renderFunction);
}
function promiseWithResolvers() {
  let resolve, reject;
  const promise = new Promise((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });
  return {
    promise,
    resolve,
    reject
  };
}
function isHttpUrl(url) {
  try {
    const parsedUrl = new URL(url);
    return VALID_PROTOCOLS.includes(parsedUrl.protocol);
  } catch {
    return false;
  }
}
function renderAllHeadContent(result) {
  result._metadata.hasRenderedHead = true;
  let content = "";
  if (result.shouldInjectCspMetaTags && result.cspDestination === "meta") {
    content += renderElement$1(
      "meta",
      {
        props: {
          "http-equiv": "content-security-policy",
          content: renderCspContent(result)
        },
        children: ""
      },
      false
    );
  }
  const styles = Array.from(result.styles).filter(uniqueElements).map(
    (style) => style.props.rel === "stylesheet" ? renderElement$1("link", style) : renderElement$1("style", style)
  );
  result.styles.clear();
  const scripts = Array.from(result.scripts).filter(uniqueElements).map((script) => {
    if (result.userAssetsBase) {
      script.props.src = (result.base === "/" ? "" : result.base) + result.userAssetsBase + script.props.src;
    }
    return renderElement$1("script", script, false);
  });
  const links = Array.from(result.links).filter(uniqueElements).map((link2) => renderElement$1("link", link2, false));
  content += styles.join("\n") + links.join("\n") + scripts.join("\n");
  if (result._metadata.extraHead.length > 0) {
    for (const part of result._metadata.extraHead) {
      content += part;
    }
  }
  return markHTMLString(content);
}
function renderHead() {
  return createRenderInstruction({ type: "head" });
}
function maybeRenderHead() {
  return createRenderInstruction({ type: "maybe-head" });
}
function encodeHexUpperCase(data) {
  let result = "";
  for (let i = 0; i < data.length; i++) {
    result += alphabetUpperCase[data[i] >> 4];
    result += alphabetUpperCase[data[i] & 15];
  }
  return result;
}
function decodeHex(data) {
  if (data.length % 2 !== 0) {
    throw new Error("Invalid hex string");
  }
  const result = new Uint8Array(data.length / 2);
  for (let i = 0; i < data.length; i += 2) {
    if (!(data[i] in decodeMap)) {
      throw new Error("Invalid character");
    }
    if (!(data[i + 1] in decodeMap)) {
      throw new Error("Invalid character");
    }
    result[i / 2] |= decodeMap[data[i]] << 4;
    result[i / 2] |= decodeMap[data[i + 1]];
  }
  return result;
}
function encodeBase64(bytes) {
  return encodeBase64_internal(bytes, base64Alphabet, EncodingPadding.Include);
}
function encodeBase64_internal(bytes, alphabet, padding) {
  let result = "";
  for (let i = 0; i < bytes.byteLength; i += 3) {
    let buffer = 0;
    let bufferBitSize = 0;
    for (let j = 0; j < 3 && i + j < bytes.byteLength; j++) {
      buffer = buffer << 8 | bytes[i + j];
      bufferBitSize += 8;
    }
    for (let j = 0; j < 4; j++) {
      if (bufferBitSize >= 6) {
        result += alphabet[buffer >> bufferBitSize - 6 & 63];
        bufferBitSize -= 6;
      } else if (bufferBitSize > 0) {
        result += alphabet[buffer << 6 - bufferBitSize & 63];
        bufferBitSize = 0;
      } else if (padding === EncodingPadding.Include) {
        result += "=";
      }
    }
  }
  return result;
}
function decodeBase64(encoded) {
  return decodeBase64_internal(encoded, base64DecodeMap, DecodingPadding.Required);
}
function decodeBase64_internal(encoded, decodeMap2, padding) {
  const result = new Uint8Array(Math.ceil(encoded.length / 4) * 3);
  let totalBytes = 0;
  for (let i = 0; i < encoded.length; i += 4) {
    let chunk = 0;
    let bitsRead = 0;
    for (let j = 0; j < 4; j++) {
      if (padding === DecodingPadding.Required && encoded[i + j] === "=") {
        continue;
      }
      if (padding === DecodingPadding.Ignore && (i + j >= encoded.length || encoded[i + j] === "=")) {
        continue;
      }
      if (j > 0 && encoded[i + j - 1] === "=") {
        throw new Error("Invalid padding");
      }
      if (!(encoded[i + j] in decodeMap2)) {
        throw new Error("Invalid character");
      }
      chunk |= decodeMap2[encoded[i + j]] << (3 - j) * 6;
      bitsRead += 6;
    }
    if (bitsRead < 24) {
      let unused;
      if (bitsRead === 12) {
        unused = chunk & 65535;
      } else if (bitsRead === 18) {
        unused = chunk & 255;
      } else {
        throw new Error("Invalid padding");
      }
      if (unused !== 0) {
        throw new Error("Invalid padding");
      }
    }
    const byteLength = Math.floor(bitsRead / 8);
    for (let i2 = 0; i2 < byteLength; i2++) {
      result[totalBytes] = chunk >> 16 - i2 * 8 & 255;
      totalBytes++;
    }
  }
  return result.slice(0, totalBytes);
}
function getErrorMap() {
  return overrideErrorMap;
}
function addIssueToContext(ctx, issueData) {
  const overrideMap = getErrorMap();
  const issue = makeIssue({
    issueData,
    data: ctx.data,
    path: ctx.path,
    errorMaps: [
      ctx.common.contextualErrorMap,
      // contextual error map is first priority
      ctx.schemaErrorMap,
      // then schema-bound map if available
      overrideMap,
      // then global override map
      overrideMap === errorMap ? void 0 : errorMap
      // then global default map
    ].filter((x) => !!x)
  });
  ctx.common.issues.push(issue);
}
function processCreateParams(params) {
  if (!params)
    return {};
  const { errorMap: errorMap2, invalid_type_error, required_error, description } = params;
  if (errorMap2 && (invalid_type_error || required_error)) {
    throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
  }
  if (errorMap2)
    return { errorMap: errorMap2, description };
  const customMap = /* @__PURE__ */ __name((iss, ctx) => {
    const { message } = params;
    if (iss.code === "invalid_enum_value") {
      return { message: message ?? ctx.defaultError };
    }
    if (typeof ctx.data === "undefined") {
      return { message: message ?? required_error ?? ctx.defaultError };
    }
    if (iss.code !== "invalid_type")
      return { message: ctx.defaultError };
    return { message: message ?? invalid_type_error ?? ctx.defaultError };
  }, "customMap");
  return { errorMap: customMap, description };
}
function timeRegexSource(args) {
  let secondsRegexSource = `[0-5]\\d`;
  if (args.precision) {
    secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}`;
  } else if (args.precision == null) {
    secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`;
  }
  const secondsQuantifier = args.precision ? "+" : "?";
  return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`;
}
function timeRegex(args) {
  return new RegExp(`^${timeRegexSource(args)}$`);
}
function datetimeRegex(args) {
  let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
  const opts = [];
  opts.push(args.local ? `Z?` : `Z`);
  if (args.offset)
    opts.push(`([+-]\\d{2}:?\\d{2})`);
  regex = `${regex}(${opts.join("|")})`;
  return new RegExp(`^${regex}$`);
}
function isValidIP(ip, version2) {
  if ((version2 === "v4" || !version2) && ipv4Regex.test(ip)) {
    return true;
  }
  if ((version2 === "v6" || !version2) && ipv6Regex.test(ip)) {
    return true;
  }
  return false;
}
function isValidJWT(jwt, alg) {
  if (!jwtRegex.test(jwt))
    return false;
  try {
    const [header] = jwt.split(".");
    if (!header)
      return false;
    const base64 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "=");
    const decoded = JSON.parse(atob(base64));
    if (typeof decoded !== "object" || decoded === null)
      return false;
    if ("typ" in decoded && decoded?.typ !== "JWT")
      return false;
    if (!decoded.alg)
      return false;
    if (alg && decoded.alg !== alg)
      return false;
    return true;
  } catch {
    return false;
  }
}
function isValidCidr(ip, version2) {
  if ((version2 === "v4" || !version2) && ipv4CidrRegex.test(ip)) {
    return true;
  }
  if ((version2 === "v6" || !version2) && ipv6CidrRegex.test(ip)) {
    return true;
  }
  return false;
}
function floatSafeRemainder(val, step) {
  const valDecCount = (val.toString().split(".")[1] || "").length;
  const stepDecCount = (step.toString().split(".")[1] || "").length;
  const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
  const valInt = Number.parseInt(val.toFixed(decCount).replace(".", ""));
  const stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
  return valInt % stepInt / 10 ** decCount;
}
function deepPartialify(schema) {
  if (schema instanceof ZodObject) {
    const newShape = {};
    for (const key in schema.shape) {
      const fieldSchema = schema.shape[key];
      newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
    }
    return new ZodObject({
      ...schema._def,
      shape: /* @__PURE__ */ __name(() => newShape, "shape")
    });
  } else if (schema instanceof ZodArray) {
    return new ZodArray({
      ...schema._def,
      type: deepPartialify(schema.element)
    });
  } else if (schema instanceof ZodOptional) {
    return ZodOptional.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodNullable) {
    return ZodNullable.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodTuple) {
    return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
  } else {
    return schema;
  }
}
function mergeValues(a, b) {
  const aType = getParsedType(a);
  const bType = getParsedType(b);
  if (a === b) {
    return { valid: true, data: a };
  } else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
    const bKeys = util.objectKeys(b);
    const sharedKeys = util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    for (const key of sharedKeys) {
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  } else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
    if (a.length !== b.length) {
      return { valid: false };
    }
    const newArray = [];
    for (let index = 0; index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  } else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) {
    return { valid: true, data: a };
  } else {
    return { valid: false };
  }
}
function createZodEnum(values, params) {
  return new ZodEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodEnum,
    ...processCreateParams(params)
  });
}
function cleanParams(params, data) {
  const p = typeof params === "function" ? params(data) : typeof params === "string" ? { message: params } : params;
  const p2 = typeof p === "string" ? { message: p } : p;
  return p2;
}
function custom(check, _params = {}, fatal) {
  if (check)
    return ZodAny.create().superRefine((data, ctx) => {
      const r2 = check(data);
      if (r2 instanceof Promise) {
        return r2.then((r3) => {
          if (!r3) {
            const params = cleanParams(_params, data);
            const _fatal = params.fatal ?? fatal ?? true;
            ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
          }
        });
      }
      if (!r2) {
        const params = cleanParams(_params, data);
        const _fatal = params.fatal ?? fatal ?? true;
        ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
      }
      return;
    });
  return ZodAny.create();
}
async function decodeKey(encoded) {
  const bytes = decodeBase64(encoded);
  return crypto.subtle.importKey("raw", bytes, ALGORITHM, true, ["encrypt", "decrypt"]);
}
async function encryptString(key, raw) {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH / 2));
  const data = encoder$1.encode(raw);
  const buffer = await crypto.subtle.encrypt(
    {
      name: ALGORITHM,
      iv
    },
    key,
    data
  );
  return encodeHexUpperCase(iv) + encodeBase64(new Uint8Array(buffer));
}
async function decryptString(key, encoded) {
  const iv = decodeHex(encoded.slice(0, IV_LENGTH));
  const dataArray = decodeBase64(encoded.slice(IV_LENGTH));
  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: ALGORITHM,
      iv
    },
    key,
    dataArray
  );
  const decryptedString = decoder$1.decode(decryptedBuffer);
  return decryptedString;
}
async function generateCspDigest(data, algorithm) {
  const hashBuffer = await crypto.subtle.digest(algorithm, encoder$1.encode(data));
  const hash = encodeBase64(new Uint8Array(hashBuffer));
  return `${ALGORITHMS[algorithm]}${hash}`;
}
function isRenderTemplateResult(obj) {
  return typeof obj === "object" && obj !== null && !!obj[renderTemplateResultSym];
}
function renderTemplate(htmlParts, ...expressions) {
  return new RenderTemplateResult(htmlParts, expressions);
}
function isSlotString(str) {
  return !!str[slotString];
}
function renderSlot(result, slotted, fallback) {
  if (!slotted && fallback) {
    return renderSlot(result, fallback);
  }
  return {
    async render(destination) {
      await renderChild(destination, typeof slotted === "function" ? slotted(result) : slotted);
    }
  };
}
async function renderSlotToString(result, slotted, fallback) {
  let content = "";
  let instructions = null;
  const temporaryDestination = {
    write(chunk) {
      if (chunk instanceof SlotString) {
        content += chunk;
        if (chunk.instructions) {
          instructions ??= [];
          instructions.push(...chunk.instructions);
        }
      } else if (chunk instanceof Response) return;
      else if (typeof chunk === "object" && "type" in chunk && typeof chunk.type === "string") {
        if (instructions === null) {
          instructions = [];
        }
        instructions.push(chunk);
      } else {
        content += chunkToString(result, chunk);
      }
    }
  };
  const renderInstance = renderSlot(result, slotted, fallback);
  await renderInstance.render(temporaryDestination);
  return markHTMLString(new SlotString(content, instructions));
}
async function renderSlots(result, slots = {}) {
  let slotInstructions = null;
  let children = {};
  if (slots) {
    await Promise.all(
      Object.entries(slots).map(
        ([key, value]) => renderSlotToString(result, value).then((output) => {
          if (output.instructions) {
            if (slotInstructions === null) {
              slotInstructions = [];
            }
            slotInstructions.push(...output.instructions);
          }
          children[key] = output;
        })
      )
    );
  }
  return { slotInstructions, children };
}
function createSlotValueFromString(content) {
  return function() {
    return renderTemplate`${unescapeHTML(content)}`;
  };
}
function containsServerDirective(props) {
  return "server:component-directive" in props;
}
function safeJsonStringify(obj) {
  return JSON.stringify(obj).replace(SCRIPT_RE, SCRIPT_REPLACER).replace(COMMENT_RE, COMMENT_REPLACER);
}
function createSearchParams(componentExport, encryptedProps, slots) {
  const params = new URLSearchParams();
  params.set("e", componentExport);
  params.set("p", encryptedProps);
  params.set("s", slots);
  return params;
}
function isWithinURLLimit(pathname, params) {
  const url = pathname + "?" + params.toString();
  const chars = url.length;
  return chars < 2048;
}
function stringifyChunk(result, chunk) {
  if (isRenderInstruction(chunk)) {
    const instruction = chunk;
    switch (instruction.type) {
      case "directive": {
        const { hydration } = instruction;
        let needsHydrationScript = hydration && determineIfNeedsHydrationScript(result);
        let needsDirectiveScript = hydration && determinesIfNeedsDirectiveScript(result, hydration.directive);
        if (needsHydrationScript) {
          let prescripts = getPrescripts(result, "both", hydration.directive);
          return markHTMLString(prescripts);
        } else if (needsDirectiveScript) {
          let prescripts = getPrescripts(result, "directive", hydration.directive);
          return markHTMLString(prescripts);
        } else {
          return "";
        }
      }
      case "head": {
        if (result._metadata.hasRenderedHead || result.partial) {
          return "";
        }
        return renderAllHeadContent(result);
      }
      case "maybe-head": {
        if (result._metadata.hasRenderedHead || result._metadata.headInTree || result.partial) {
          return "";
        }
        return renderAllHeadContent(result);
      }
      case "renderer-hydration-script": {
        const { rendererSpecificHydrationScripts } = result._metadata;
        const { rendererName } = instruction;
        if (!rendererSpecificHydrationScripts.has(rendererName)) {
          rendererSpecificHydrationScripts.add(rendererName);
          return instruction.render();
        }
        return "";
      }
      case "server-island-runtime": {
        if (result._metadata.hasRenderedServerIslandRuntime) {
          return "";
        }
        result._metadata.hasRenderedServerIslandRuntime = true;
        return renderServerIslandRuntime();
      }
      default: {
        throw new Error(`Unknown chunk type: ${chunk.type}`);
      }
    }
  } else if (chunk instanceof Response) {
    return "";
  } else if (isSlotString(chunk)) {
    let out = "";
    const c = chunk;
    if (c.instructions) {
      for (const instr of c.instructions) {
        out += stringifyChunk(result, instr);
      }
    }
    out += chunk.toString();
    return out;
  }
  return chunk.toString();
}
function chunkToString(result, chunk) {
  if (ArrayBuffer.isView(chunk)) {
    return decoder.decode(chunk);
  } else {
    return stringifyChunk(result, chunk);
  }
}
function chunkToByteArray(result, chunk) {
  if (ArrayBuffer.isView(chunk)) {
    return chunk;
  } else {
    const stringified = stringifyChunk(result, chunk);
    return encoder.encode(stringified.toString());
  }
}
function isRenderInstance(obj) {
  return !!obj && typeof obj === "object" && "render" in obj && typeof obj.render === "function";
}
function renderChild(destination, child) {
  if (isPromise(child)) {
    return child.then((x) => renderChild(destination, x));
  }
  if (child instanceof SlotString) {
    destination.write(child);
    return;
  }
  if (isHTMLString(child)) {
    destination.write(child);
    return;
  }
  if (Array.isArray(child)) {
    return renderArray(destination, child);
  }
  if (typeof child === "function") {
    return renderChild(destination, child());
  }
  if (!child && child !== 0) {
    return;
  }
  if (typeof child === "string") {
    destination.write(markHTMLString(escapeHTML(child)));
    return;
  }
  if (isRenderInstance(child)) {
    return child.render(destination);
  }
  if (isRenderTemplateResult(child)) {
    return child.render(destination);
  }
  if (isAstroComponentInstance(child)) {
    return child.render(destination);
  }
  if (ArrayBuffer.isView(child)) {
    destination.write(child);
    return;
  }
  if (typeof child === "object" && (Symbol.asyncIterator in child || Symbol.iterator in child)) {
    if (Symbol.asyncIterator in child) {
      return renderAsyncIterable(destination, child);
    }
    return renderIterable(destination, child);
  }
  destination.write(child);
}
function renderArray(destination, children) {
  const flushers = children.map((c) => {
    return createBufferedRenderer(destination, (bufferDestination) => {
      return renderChild(bufferDestination, c);
    });
  });
  const iterator = flushers[Symbol.iterator]();
  const iterate = /* @__PURE__ */ __name(() => {
    for (; ; ) {
      const { value: flusher, done } = iterator.next();
      if (done) {
        break;
      }
      const result = flusher.flush();
      if (isPromise(result)) {
        return result.then(iterate);
      }
    }
  }, "iterate");
  return iterate();
}
function renderIterable(destination, children) {
  const iterator = children[Symbol.iterator]();
  const iterate = /* @__PURE__ */ __name(() => {
    for (; ; ) {
      const { value, done } = iterator.next();
      if (done) {
        break;
      }
      const result = renderChild(destination, value);
      if (isPromise(result)) {
        return result.then(iterate);
      }
    }
  }, "iterate");
  return iterate();
}
async function renderAsyncIterable(destination, children) {
  for await (const value of children) {
    await renderChild(destination, value);
  }
}
function validateComponentProps(props, clientDirectives, displayName) {
  if (props != null) {
    const directives = [...clientDirectives.keys()].map((directive) => `client:${directive}`);
    for (const prop of Object.keys(props)) {
      if (directives.includes(prop)) {
        console.warn(
          `You are attempting to render <${displayName} ${prop} />, but ${displayName} is an Astro component. Astro components do not render in the client and should not have a hydration directive. Please use a framework component for client rendering.`
        );
      }
    }
  }
}
function createAstroComponentInstance(result, displayName, factory, props, slots = {}) {
  validateComponentProps(props, result.clientDirectives, displayName);
  const instance = new AstroComponentInstance(result, props, slots, factory);
  if (isAPropagatingComponent(result, factory)) {
    result._metadata.propagators.add(instance);
  }
  return instance;
}
function isAstroComponentInstance(obj) {
  return typeof obj === "object" && obj !== null && !!obj[astroComponentInstanceSym];
}
async function renderToString(result, componentFactory, props, children, isPage = false, route) {
  const templateResult = await callComponentAsTemplateResultOrResponse(
    result,
    componentFactory,
    props,
    children,
    route
  );
  if (templateResult instanceof Response) return templateResult;
  let str = "";
  let renderedFirstPageChunk = false;
  if (isPage) {
    await bufferHeadContent(result);
  }
  const destination = {
    write(chunk) {
      if (isPage && !renderedFirstPageChunk) {
        renderedFirstPageChunk = true;
        if (!result.partial && !DOCTYPE_EXP.test(String(chunk))) {
          const doctype = result.compressHTML ? "<!DOCTYPE html>" : "<!DOCTYPE html>\n";
          str += doctype;
        }
      }
      if (chunk instanceof Response) return;
      str += chunkToString(result, chunk);
    }
  };
  await templateResult.render(destination);
  return str;
}
async function renderToReadableStream(result, componentFactory, props, children, isPage = false, route) {
  const templateResult = await callComponentAsTemplateResultOrResponse(
    result,
    componentFactory,
    props,
    children,
    route
  );
  if (templateResult instanceof Response) return templateResult;
  let renderedFirstPageChunk = false;
  if (isPage) {
    await bufferHeadContent(result);
  }
  return new ReadableStream({
    start(controller) {
      const destination = {
        write(chunk) {
          if (isPage && !renderedFirstPageChunk) {
            renderedFirstPageChunk = true;
            if (!result.partial && !DOCTYPE_EXP.test(String(chunk))) {
              const doctype = result.compressHTML ? "<!DOCTYPE html>" : "<!DOCTYPE html>\n";
              controller.enqueue(encoder.encode(doctype));
            }
          }
          if (chunk instanceof Response) {
            throw new AstroError({
              ...ResponseSentError
            });
          }
          const bytes = chunkToByteArray(result, chunk);
          controller.enqueue(bytes);
        }
      };
      (async () => {
        try {
          await templateResult.render(destination);
          controller.close();
        } catch (e) {
          if (AstroError.is(e) && !e.loc) {
            e.setLocation({
              file: route?.component
            });
          }
          setTimeout(() => controller.error(e), 0);
        }
      })();
    },
    cancel() {
      result.cancelled = true;
    }
  });
}
async function callComponentAsTemplateResultOrResponse(result, componentFactory, props, children, route) {
  const factoryResult = await componentFactory(result, props, children);
  if (factoryResult instanceof Response) {
    return factoryResult;
  } else if (isHeadAndContent(factoryResult)) {
    if (!isRenderTemplateResult(factoryResult.content)) {
      throw new AstroError({
        ...OnlyResponseCanBeReturned,
        message: OnlyResponseCanBeReturned.message(
          route?.route,
          typeof factoryResult
        ),
        location: {
          file: route?.component
        }
      });
    }
    return factoryResult.content;
  } else if (!isRenderTemplateResult(factoryResult)) {
    throw new AstroError({
      ...OnlyResponseCanBeReturned,
      message: OnlyResponseCanBeReturned.message(route?.route, typeof factoryResult),
      location: {
        file: route?.component
      }
    });
  }
  return factoryResult;
}
async function bufferHeadContent(result) {
  const iterator = result._metadata.propagators.values();
  while (true) {
    const { value, done } = iterator.next();
    if (done) {
      break;
    }
    const returnValue = await value.init(result);
    if (isHeadAndContent(returnValue) && returnValue.head) {
      result._metadata.extraHead.push(returnValue.head);
    }
  }
}
async function renderToAsyncIterable(result, componentFactory, props, children, isPage = false, route) {
  const templateResult = await callComponentAsTemplateResultOrResponse(
    result,
    componentFactory,
    props,
    children,
    route
  );
  if (templateResult instanceof Response) return templateResult;
  let renderedFirstPageChunk = false;
  if (isPage) {
    await bufferHeadContent(result);
  }
  let error4 = null;
  let next = null;
  const buffer = [];
  let renderingComplete = false;
  const iterator = {
    async next() {
      if (result.cancelled) return { done: true, value: void 0 };
      if (next !== null) {
        await next.promise;
      } else if (!renderingComplete && !buffer.length) {
        next = promiseWithResolvers();
        await next.promise;
      }
      if (!renderingComplete) {
        next = promiseWithResolvers();
      }
      if (error4) {
        throw error4;
      }
      let length = 0;
      for (let i = 0, len = buffer.length; i < len; i++) {
        length += buffer[i].length;
      }
      let mergedArray = new Uint8Array(length);
      let offset = 0;
      for (let i = 0, len = buffer.length; i < len; i++) {
        const item = buffer[i];
        mergedArray.set(item, offset);
        offset += item.length;
      }
      buffer.length = 0;
      const returnValue = {
        // The iterator is done when rendering has finished
        // and there are no more chunks to return.
        done: length === 0 && renderingComplete,
        value: mergedArray
      };
      return returnValue;
    },
    async return() {
      result.cancelled = true;
      return { done: true, value: void 0 };
    }
  };
  const destination = {
    write(chunk) {
      if (isPage && !renderedFirstPageChunk) {
        renderedFirstPageChunk = true;
        if (!result.partial && !DOCTYPE_EXP.test(String(chunk))) {
          const doctype = result.compressHTML ? "<!DOCTYPE html>" : "<!DOCTYPE html>\n";
          buffer.push(encoder.encode(doctype));
        }
      }
      if (chunk instanceof Response) {
        throw new AstroError(ResponseSentError);
      }
      const bytes = chunkToByteArray(result, chunk);
      if (bytes.length > 0) {
        buffer.push(bytes);
        next?.resolve();
      } else if (buffer.length > 0) {
        next?.resolve();
      }
    }
  };
  const renderResult = toPromise(() => templateResult.render(destination));
  renderResult.catch((err) => {
    error4 = err;
  }).finally(() => {
    renderingComplete = true;
    next?.resolve();
  });
  return {
    [Symbol.asyncIterator]() {
      return iterator;
    }
  };
}
function toPromise(fn) {
  try {
    const result = fn();
    return isPromise(result) ? result : Promise.resolve(result);
  } catch (err) {
    return Promise.reject(err);
  }
}
function componentIsHTMLElement(Component) {
  return typeof HTMLElement !== "undefined" && HTMLElement.isPrototypeOf(Component);
}
async function renderHTMLElement(result, constructor, props, slots) {
  const name = getHTMLElementName(constructor);
  let attrHTML = "";
  for (const attr in props) {
    attrHTML += ` ${attr}="${toAttributeString(await props[attr])}"`;
  }
  return markHTMLString(
    `<${name}${attrHTML}>${await renderSlotToString(result, slots?.default)}</${name}>`
  );
}
function getHTMLElementName(constructor) {
  const definedName = customElements.getName(constructor);
  if (definedName) return definedName;
  const assignedName = constructor.name.replace(/^HTML|Element$/g, "").replace(/[A-Z]/g, "-$&").toLowerCase().replace(/^-/, "html-");
  return assignedName;
}
function guessRenderers(componentUrl) {
  const extname = componentUrl?.split(".").pop();
  switch (extname) {
    case "svelte":
      return ["@astrojs/svelte"];
    case "vue":
      return ["@astrojs/vue"];
    case "jsx":
    case "tsx":
      return ["@astrojs/react", "@astrojs/preact", "@astrojs/solid-js", "@astrojs/vue (jsx)"];
    case void 0:
    default:
      return [
        "@astrojs/react",
        "@astrojs/preact",
        "@astrojs/solid-js",
        "@astrojs/vue",
        "@astrojs/svelte"
      ];
  }
}
function isFragmentComponent(Component) {
  return Component === Fragment;
}
function isHTMLComponent(Component) {
  return Component && Component["astro:html"] === true;
}
function removeStaticAstroSlot(html, supportsAstroStaticSlot = true) {
  const exp = supportsAstroStaticSlot ? ASTRO_STATIC_SLOT_EXP : ASTRO_SLOT_EXP;
  return html.replace(exp, "");
}
async function renderFrameworkComponent(result, displayName, Component, _props, slots = {}) {
  if (!Component && "client:only" in _props === false) {
    throw new Error(
      `Unable to render ${displayName} because it is ${Component}!
Did you forget to import the component or is it possible there is a typo?`
    );
  }
  const { renderers: renderers2, clientDirectives } = result;
  const metadata = {
    astroStaticSlot: true,
    displayName
  };
  const { hydration, isPage, props, propsWithoutTransitionAttributes } = extractDirectives(
    _props,
    clientDirectives
  );
  let html = "";
  let attrs = void 0;
  if (hydration) {
    metadata.hydrate = hydration.directive;
    metadata.hydrateArgs = hydration.value;
    metadata.componentExport = hydration.componentExport;
    metadata.componentUrl = hydration.componentUrl;
  }
  const probableRendererNames = guessRenderers(metadata.componentUrl);
  const validRenderers = renderers2.filter((r2) => r2.name !== "astro:jsx");
  const { children, slotInstructions } = await renderSlots(result, slots);
  let renderer;
  if (metadata.hydrate !== "only") {
    let isTagged = false;
    try {
      isTagged = Component && Component[Renderer];
    } catch {
    }
    if (isTagged) {
      const rendererName = Component[Renderer];
      renderer = renderers2.find(({ name }) => name === rendererName);
    }
    if (!renderer) {
      let error4;
      for (const r2 of renderers2) {
        try {
          if (await r2.ssr.check.call({ result }, Component, props, children)) {
            renderer = r2;
            break;
          }
        } catch (e) {
          error4 ??= e;
        }
      }
      if (!renderer && error4) {
        throw error4;
      }
    }
    if (!renderer && typeof HTMLElement === "function" && componentIsHTMLElement(Component)) {
      const output = await renderHTMLElement(
        result,
        Component,
        _props,
        slots
      );
      return {
        render(destination) {
          destination.write(output);
        }
      };
    }
  } else {
    if (metadata.hydrateArgs) {
      const rendererName = rendererAliases.has(metadata.hydrateArgs) ? rendererAliases.get(metadata.hydrateArgs) : metadata.hydrateArgs;
      if (clientOnlyValues.has(rendererName)) {
        renderer = renderers2.find(
          ({ name }) => name === `@astrojs/${rendererName}` || name === rendererName
        );
      }
    }
    if (!renderer && validRenderers.length === 1) {
      renderer = validRenderers[0];
    }
    if (!renderer) {
      const extname = metadata.componentUrl?.split(".").pop();
      renderer = renderers2.find(({ name }) => name === `@astrojs/${extname}` || name === extname);
    }
  }
  if (!renderer) {
    if (metadata.hydrate === "only") {
      const rendererName = rendererAliases.has(metadata.hydrateArgs) ? rendererAliases.get(metadata.hydrateArgs) : metadata.hydrateArgs;
      if (clientOnlyValues.has(rendererName)) {
        const plural = validRenderers.length > 1;
        throw new AstroError({
          ...NoMatchingRenderer,
          message: NoMatchingRenderer.message(
            metadata.displayName,
            metadata?.componentUrl?.split(".").pop(),
            plural,
            validRenderers.length
          ),
          hint: NoMatchingRenderer.hint(
            formatList(probableRendererNames.map((r2) => "`" + r2 + "`"))
          )
        });
      } else {
        throw new AstroError({
          ...NoClientOnlyHint,
          message: NoClientOnlyHint.message(metadata.displayName),
          hint: NoClientOnlyHint.hint(
            probableRendererNames.map((r2) => r2.replace("@astrojs/", "")).join("|")
          )
        });
      }
    } else if (typeof Component !== "string") {
      const matchingRenderers = validRenderers.filter(
        (r2) => probableRendererNames.includes(r2.name)
      );
      const plural = validRenderers.length > 1;
      if (matchingRenderers.length === 0) {
        throw new AstroError({
          ...NoMatchingRenderer,
          message: NoMatchingRenderer.message(
            metadata.displayName,
            metadata?.componentUrl?.split(".").pop(),
            plural,
            validRenderers.length
          ),
          hint: NoMatchingRenderer.hint(
            formatList(probableRendererNames.map((r2) => "`" + r2 + "`"))
          )
        });
      } else if (matchingRenderers.length === 1) {
        renderer = matchingRenderers[0];
        ({ html, attrs } = await renderer.ssr.renderToStaticMarkup.call(
          { result },
          Component,
          propsWithoutTransitionAttributes,
          children,
          metadata
        ));
      } else {
        throw new Error(`Unable to render ${metadata.displayName}!

This component likely uses ${formatList(probableRendererNames)},
but Astro encountered an error during server-side rendering.

Please ensure that ${metadata.displayName}:
1. Does not unconditionally access browser-specific globals like \`window\` or \`document\`.
   If this is unavoidable, use the \`client:only\` hydration directive.
2. Does not conditionally return \`null\` or \`undefined\` when rendered on the server.

If you're still stuck, please open an issue on GitHub or join us at https://astro.build/chat.`);
      }
    }
  } else {
    if (metadata.hydrate === "only") {
      html = await renderSlotToString(result, slots?.fallback);
    } else {
      performance.now();
      ({ html, attrs } = await renderer.ssr.renderToStaticMarkup.call(
        { result },
        Component,
        propsWithoutTransitionAttributes,
        children,
        metadata
      ));
    }
  }
  if (!html && typeof Component === "string") {
    const Tag = sanitizeElementName(Component);
    const childSlots = Object.values(children).join("");
    const renderTemplateResult = renderTemplate`<${Tag}${internalSpreadAttributes(
      props,
      true,
      Tag
    )}${markHTMLString(
      childSlots === "" && voidElementNames.test(Tag) ? `/>` : `>${childSlots}</${Tag}>`
    )}`;
    html = "";
    const destination = {
      write(chunk) {
        if (chunk instanceof Response) return;
        html += chunkToString(result, chunk);
      }
    };
    await renderTemplateResult.render(destination);
  }
  if (!hydration) {
    return {
      render(destination) {
        if (slotInstructions) {
          for (const instruction of slotInstructions) {
            destination.write(instruction);
          }
        }
        if (isPage || renderer?.name === "astro:jsx") {
          destination.write(html);
        } else if (html && html.length > 0) {
          destination.write(
            markHTMLString(removeStaticAstroSlot(html, renderer?.ssr?.supportsAstroStaticSlot))
          );
        }
      }
    };
  }
  const astroId = shorthash(
    `<!--${metadata.componentExport.value}:${metadata.componentUrl}-->
${html}
${serializeProps(
      props,
      metadata
    )}`
  );
  const island = await generateHydrateScript(
    { renderer, result, astroId, props, attrs },
    metadata
  );
  let unrenderedSlots = [];
  if (html) {
    if (Object.keys(children).length > 0) {
      for (const key of Object.keys(children)) {
        let tagName = renderer?.ssr?.supportsAstroStaticSlot ? !!metadata.hydrate ? "astro-slot" : "astro-static-slot" : "astro-slot";
        let expectedHTML = key === "default" ? `<${tagName}>` : `<${tagName} name="${key}">`;
        if (!html.includes(expectedHTML)) {
          unrenderedSlots.push(key);
        }
      }
    }
  } else {
    unrenderedSlots = Object.keys(children);
  }
  const template2 = unrenderedSlots.length > 0 ? unrenderedSlots.map(
    (key) => `<template data-astro-template${key !== "default" ? `="${key}"` : ""}>${children[key]}</template>`
  ).join("") : "";
  island.children = `${html ?? ""}${template2}`;
  if (island.children) {
    island.props["await-children"] = "";
    island.children += `<!--astro:end-->`;
  }
  return {
    render(destination) {
      if (slotInstructions) {
        for (const instruction of slotInstructions) {
          destination.write(instruction);
        }
      }
      destination.write(createRenderInstruction({ type: "directive", hydration }));
      if (hydration.directive !== "only" && renderer?.ssr.renderHydrationScript) {
        destination.write(
          createRenderInstruction({
            type: "renderer-hydration-script",
            rendererName: renderer.name,
            render: renderer.ssr.renderHydrationScript
          })
        );
      }
      const renderedElement = renderElement$1("astro-island", island, false);
      destination.write(markHTMLString(renderedElement));
    }
  };
}
function sanitizeElementName(tag) {
  const unsafe = /[&<>'"\s]+/;
  if (!unsafe.test(tag)) return tag;
  return tag.trim().split(unsafe)[0].trim();
}
async function renderFragmentComponent(result, slots = {}) {
  const children = await renderSlotToString(result, slots?.default);
  return {
    render(destination) {
      if (children == null) return;
      destination.write(children);
    }
  };
}
async function renderHTMLComponent(result, Component, _props, slots = {}) {
  const { slotInstructions, children } = await renderSlots(result, slots);
  const html = Component({ slots: children });
  const hydrationHtml = slotInstructions ? slotInstructions.map((instr) => chunkToString(result, instr)).join("") : "";
  return {
    render(destination) {
      destination.write(markHTMLString(hydrationHtml + html));
    }
  };
}
function renderAstroComponent(result, displayName, Component, props, slots = {}) {
  if (containsServerDirective(props)) {
    const serverIslandComponent = new ServerIslandComponent(result, props, slots, displayName);
    result._metadata.propagators.add(serverIslandComponent);
    return serverIslandComponent;
  }
  const instance = createAstroComponentInstance(result, displayName, Component, props, slots);
  return {
    render(destination) {
      return instance.render(destination);
    }
  };
}
function renderComponent(result, displayName, Component, props, slots = {}) {
  if (isPromise(Component)) {
    return Component.catch(handleCancellation).then((x) => {
      return renderComponent(result, displayName, x, props, slots);
    });
  }
  if (isFragmentComponent(Component)) {
    return renderFragmentComponent(result, slots).catch(handleCancellation);
  }
  props = normalizeProps(props);
  if (isHTMLComponent(Component)) {
    return renderHTMLComponent(result, Component, props, slots).catch(handleCancellation);
  }
  if (isAstroComponentFactory(Component)) {
    return renderAstroComponent(result, displayName, Component, props, slots);
  }
  return renderFrameworkComponent(result, displayName, Component, props, slots).catch(
    handleCancellation
  );
  function handleCancellation(e) {
    if (result.cancelled)
      return {
        render() {
        }
      };
    throw e;
  }
  __name(handleCancellation, "handleCancellation");
}
function normalizeProps(props) {
  if (props["class:list"] !== void 0) {
    const value = props["class:list"];
    delete props["class:list"];
    props["class"] = clsx(props["class"], value);
    if (props["class"] === "") {
      delete props["class"];
    }
  }
  return props;
}
async function renderComponentToString(result, displayName, Component, props, slots = {}, isPage = false, route) {
  let str = "";
  let renderedFirstPageChunk = false;
  let head = "";
  if (isPage && !result.partial && nonAstroPageNeedsHeadInjection(Component)) {
    head += chunkToString(result, maybeRenderHead());
  }
  try {
    const destination = {
      write(chunk) {
        if (isPage && !result.partial && !renderedFirstPageChunk) {
          renderedFirstPageChunk = true;
          if (!/<!doctype html/i.test(String(chunk))) {
            const doctype = result.compressHTML ? "<!DOCTYPE html>" : "<!DOCTYPE html>\n";
            str += doctype + head;
          }
        }
        if (chunk instanceof Response) return;
        str += chunkToString(result, chunk);
      }
    };
    const renderInstance = await renderComponent(result, displayName, Component, props, slots);
    if (containsServerDirective(props)) {
      await bufferHeadContent(result);
    }
    await renderInstance.render(destination);
  } catch (e) {
    if (AstroError.is(e) && !e.loc) {
      e.setLocation({
        file: route?.component
      });
    }
    throw e;
  }
  return str;
}
function nonAstroPageNeedsHeadInjection(pageComponent) {
  return !!pageComponent?.[needsHeadRenderingSymbol];
}
async function renderJSX(result, vnode) {
  switch (true) {
    case vnode instanceof HTMLString:
      if (vnode.toString().trim() === "") {
        return "";
      }
      return vnode;
    case typeof vnode === "string":
      return markHTMLString(escapeHTML(vnode));
    case typeof vnode === "function":
      return vnode;
    case (!vnode && vnode !== 0):
      return "";
    case Array.isArray(vnode):
      return markHTMLString(
        (await Promise.all(vnode.map((v) => renderJSX(result, v)))).join("")
      );
  }
  return renderJSXVNode(result, vnode);
}
async function renderJSXVNode(result, vnode) {
  if (isVNode(vnode)) {
    switch (true) {
      case !vnode.type: {
        throw new Error(`Unable to render ${result.pathname} because it contains an undefined Component!
Did you forget to import the component or is it possible there is a typo?`);
      }
      case vnode.type === Symbol.for("astro:fragment"):
        return renderJSX(result, vnode.props.children);
      case isAstroComponentFactory(vnode.type): {
        let props = {};
        let slots = {};
        for (const [key, value] of Object.entries(vnode.props ?? {})) {
          if (key === "children" || value && typeof value === "object" && value["$$slot"]) {
            slots[key === "children" ? "default" : key] = () => renderJSX(result, value);
          } else {
            props[key] = value;
          }
        }
        const str = await renderComponentToString(
          result,
          vnode.type.name,
          vnode.type,
          props,
          slots
        );
        const html = markHTMLString(str);
        return html;
      }
      case (!vnode.type && vnode.type !== 0):
        return "";
      case (typeof vnode.type === "string" && vnode.type !== ClientOnlyPlaceholder):
        return markHTMLString(await renderElement(result, vnode.type, vnode.props ?? {}));
    }
    if (vnode.type) {
      let extractSlots2 = /* @__PURE__ */ __name(function(child) {
        if (Array.isArray(child)) {
          return child.map((c) => extractSlots2(c));
        }
        if (!isVNode(child)) {
          _slots.default.push(child);
          return;
        }
        if ("slot" in child.props) {
          _slots[child.props.slot] = [..._slots[child.props.slot] ?? [], child];
          delete child.props.slot;
          return;
        }
        _slots.default.push(child);
      }, "extractSlots2");
      if (typeof vnode.type === "function" && vnode.props["server:root"]) {
        const output2 = await vnode.type(vnode.props ?? {});
        return await renderJSX(result, output2);
      }
      if (typeof vnode.type === "function") {
        if (vnode.props[hasTriedRenderComponentSymbol]) {
          delete vnode.props[hasTriedRenderComponentSymbol];
          const output2 = await vnode.type(vnode.props ?? {});
          if (output2?.[AstroJSX] || !output2) {
            return await renderJSXVNode(result, output2);
          } else {
            return;
          }
        } else {
          vnode.props[hasTriedRenderComponentSymbol] = true;
        }
      }
      const { children = null, ...props } = vnode.props ?? {};
      const _slots = {
        default: []
      };
      extractSlots2(children);
      for (const [key, value] of Object.entries(props)) {
        if (value?.["$$slot"]) {
          _slots[key] = value;
          delete props[key];
        }
      }
      const slotPromises = [];
      const slots = {};
      for (const [key, value] of Object.entries(_slots)) {
        slotPromises.push(
          renderJSX(result, value).then((output2) => {
            if (output2.toString().trim().length === 0) return;
            slots[key] = () => output2;
          })
        );
      }
      await Promise.all(slotPromises);
      let output;
      if (vnode.type === ClientOnlyPlaceholder && vnode.props["client:only"]) {
        output = await renderComponentToString(
          result,
          vnode.props["client:display-name"] ?? "",
          null,
          props,
          slots
        );
      } else {
        output = await renderComponentToString(
          result,
          typeof vnode.type === "function" ? vnode.type.name : vnode.type,
          vnode.type,
          props,
          slots
        );
      }
      return markHTMLString(output);
    }
  }
  return markHTMLString(`${vnode}`);
}
async function renderElement(result, tag, { children, ...props }) {
  return markHTMLString(
    `<${tag}${spreadAttributes(props)}${markHTMLString(
      (children == null || children == "") && voidElementNames.test(tag) ? `/>` : `>${children == null ? "" : await renderJSX(result, prerenderElementChildren(tag, children))}</${tag}>`
    )}`
  );
}
function prerenderElementChildren(tag, children) {
  if (typeof children === "string" && (tag === "style" || tag === "script")) {
    return markHTMLString(children);
  } else {
    return children;
  }
}
async function renderPage(result, componentFactory, props, children, streaming, route) {
  if (!isAstroComponentFactory(componentFactory)) {
    result._metadata.headInTree = result.componentMetadata.get(componentFactory.moduleId)?.containsHead ?? false;
    const pageProps = { ...props ?? {}, "server:root": true };
    const str = await renderComponentToString(
      result,
      componentFactory.name,
      componentFactory,
      pageProps,
      {},
      true,
      route
    );
    const bytes = encoder.encode(str);
    const headers2 = new Headers([
      ["Content-Type", "text/html"],
      ["Content-Length", bytes.byteLength.toString()]
    ]);
    if (result.shouldInjectCspMetaTags && (result.cspDestination === "header" || result.cspDestination === "adapter")) {
      headers2.set("content-security-policy", renderCspContent(result));
    }
    return new Response(bytes, {
      headers: headers2
    });
  }
  result._metadata.headInTree = result.componentMetadata.get(componentFactory.moduleId)?.containsHead ?? false;
  let body;
  if (streaming) {
    if (isNode && !isDeno) {
      const nodeBody = await renderToAsyncIterable(
        result,
        componentFactory,
        props,
        children,
        true,
        route
      );
      body = nodeBody;
    } else {
      body = await renderToReadableStream(result, componentFactory, props, children, true, route);
    }
  } else {
    body = await renderToString(result, componentFactory, props, children, true, route);
  }
  if (body instanceof Response) return body;
  const init2 = result.response;
  const headers = new Headers(init2.headers);
  if (result.shouldInjectCspMetaTags && result.cspDestination === "header" || result.cspDestination === "adapter") {
    headers.set("content-security-policy", renderCspContent(result));
  }
  if (!streaming && typeof body === "string") {
    body = encoder.encode(body);
    headers.set("Content-Length", body.byteLength.toString());
  }
  let status = init2.status;
  let statusText = init2.statusText;
  if (route?.route === "/404") {
    status = 404;
    if (statusText === "OK") {
      statusText = "Not Found";
    }
  } else if (route?.route === "/500") {
    status = 500;
    if (statusText === "OK") {
      statusText = "Internal Server Error";
    }
  }
  if (status) {
    return new Response(body, { ...init2, headers, status, statusText });
  } else {
    return new Response(body, { ...init2, headers });
  }
}
async function renderScript(result, id) {
  if (result._metadata.renderedScripts.has(id)) return;
  result._metadata.renderedScripts.add(id);
  const inlined = result.inlinedScripts.get(id);
  if (inlined != null) {
    if (inlined) {
      return markHTMLString(`<script type="module">${inlined}<\/script>`);
    } else {
      return "";
    }
  }
  const resolved = await result.resolve(id);
  return markHTMLString(
    `<script type="module" src="${result.userAssetsBase ? (result.base === "/" ? "" : result.base) + result.userAssetsBase : ""}${resolved}"><\/script>`
  );
}
function requireCssesc() {
  if (hasRequiredCssesc) return cssesc_1;
  hasRequiredCssesc = 1;
  var object = {};
  var hasOwnProperty = object.hasOwnProperty;
  var merge = /* @__PURE__ */ __name(function merge2(options, defaults) {
    if (!options) {
      return defaults;
    }
    var result = {};
    for (var key in defaults) {
      result[key] = hasOwnProperty.call(options, key) ? options[key] : defaults[key];
    }
    return result;
  }, "merge");
  var regexAnySingleEscape = /[ -,\.\/:-@\[-\^`\{-~]/;
  var regexSingleEscape = /[ -,\.\/:-@\[\]\^`\{-~]/;
  var regexExcessiveSpaces = /(^|\\+)?(\\[A-F0-9]{1,6})\x20(?![a-fA-F0-9\x20])/g;
  var cssesc = /* @__PURE__ */ __name(function cssesc2(string, options) {
    options = merge(options, cssesc2.options);
    if (options.quotes != "single" && options.quotes != "double") {
      options.quotes = "single";
    }
    var quote = options.quotes == "double" ? '"' : "'";
    var isIdentifier = options.isIdentifier;
    var firstChar = string.charAt(0);
    var output = "";
    var counter = 0;
    var length = string.length;
    while (counter < length) {
      var character = string.charAt(counter++);
      var codePoint = character.charCodeAt();
      var value = void 0;
      if (codePoint < 32 || codePoint > 126) {
        if (codePoint >= 55296 && codePoint <= 56319 && counter < length) {
          var extra = string.charCodeAt(counter++);
          if ((extra & 64512) == 56320) {
            codePoint = ((codePoint & 1023) << 10) + (extra & 1023) + 65536;
          } else {
            counter--;
          }
        }
        value = "\\" + codePoint.toString(16).toUpperCase() + " ";
      } else {
        if (options.escapeEverything) {
          if (regexAnySingleEscape.test(character)) {
            value = "\\" + character;
          } else {
            value = "\\" + codePoint.toString(16).toUpperCase() + " ";
          }
        } else if (/[\t\n\f\r\x0B]/.test(character)) {
          value = "\\" + codePoint.toString(16).toUpperCase() + " ";
        } else if (character == "\\" || !isIdentifier && (character == '"' && quote == character || character == "'" && quote == character) || isIdentifier && regexSingleEscape.test(character)) {
          value = "\\" + character;
        } else {
          value = character;
        }
      }
      output += value;
    }
    if (isIdentifier) {
      if (/^-[-\d]/.test(output)) {
        output = "\\-" + output.slice(1);
      } else if (/\d/.test(firstChar)) {
        output = "\\3" + firstChar + " " + output.slice(1);
      }
    }
    output = output.replace(regexExcessiveSpaces, function($0, $1, $2) {
      if ($1 && $1.length % 2) {
        return $0;
      }
      return ($1 || "") + $2;
    });
    if (!isIdentifier && options.wrap) {
      return quote + output + quote;
    }
    return output;
  }, "cssesc");
  cssesc.options = {
    "escapeEverything": false,
    "isIdentifier": false,
    "quotes": "single",
    "wrap": false
  };
  cssesc.version = "3.0.0";
  cssesc_1 = cssesc;
  return cssesc_1;
}
function spreadAttributes(values = {}, _name, { class: scopedClassName } = {}) {
  let output = "";
  if (scopedClassName) {
    if (typeof values.class !== "undefined") {
      values.class += ` ${scopedClassName}`;
    } else if (typeof values["class:list"] !== "undefined") {
      values["class:list"] = [values["class:list"], scopedClassName];
    } else {
      values.class = scopedClassName;
    }
  }
  for (const [key, value] of Object.entries(values)) {
    output += addAttribute(value, key, true, _name);
  }
  return markHTMLString(output);
}
var ASTRO_VERSION, REROUTE_DIRECTIVE_HEADER, REWRITE_DIRECTIVE_HEADER_KEY, REWRITE_DIRECTIVE_HEADER_VALUE, NOOP_MIDDLEWARE_HEADER, ROUTE_TYPE_HEADER, DEFAULT_404_COMPONENT, REDIRECT_STATUS_CODES, REROUTABLE_STATUS_CODES, clientAddressSymbol, originPathnameSymbol, responseSentSymbol, AstroError, ClientAddressNotAvailable, PrerenderClientAddressNotAvailable, StaticClientAddressNotAvailable, NoMatchingStaticPathFound, OnlyResponseCanBeReturned, MissingMediaQueryDirective, NoMatchingRenderer, NoClientOnlyHint, InvalidGetStaticPathsEntry, InvalidGetStaticPathsReturn, GetStaticPathsExpectedParams, GetStaticPathsInvalidRouteParam, GetStaticPathsRequired, ReservedSlotName, NoMatchingImport, InvalidComponentArgs, PageNumberParamNotFound, PrerenderDynamicEndpointPathCollide, ResponseSentError, MiddlewareNoDataOrNextCalled, MiddlewareNotAResponse, EndpointDidNotReturnAResponse, LocalsNotAnObject, LocalsReassigned, AstroResponseHeadersReassigned, AstroGlobUsedOutside, AstroGlobNoMatch, i18nNoLocaleFoundInPath, RewriteWithBodyUsed, ForbiddenRewrite, CspNotEnabled, ActionsReturnedInvalidDataError, ActionNotFoundError, SessionStorageInitError, SessionStorageSaveError, FORCE_COLOR, NODE_DISABLE_COLORS, NO_COLOR, TERM, isTTY, $, bold, dim, red, green, yellow, blue, replace, ca, esca, pe, escape, escapeHTML, HTMLBytes, HTMLString, markHTMLString, AstroJSX, PROP_TYPE, transitionDirectivesToCopyOnIsland, dictionary, binary, headAndContentSym, astro_island_prebuilt_default, ISLAND_STYLES, RenderInstructionSymbol, voidElementNames, htmlBooleanAttributes, AMPERSAND_REGEX, DOUBLE_QUOTE_REGEX, STATIC_DIRECTIVES, toIdent, toAttributeString, kebab, toStyleString, noop, BufferedRenderer, isNode, isDeno, VALID_PROTOCOLS, uniqueElements, alphabetUpperCase, decodeMap, EncodingPadding$1, DecodingPadding$1, base64Alphabet, EncodingPadding, DecodingPadding, base64DecodeMap, util, objectUtil, ZodParsedType, getParsedType, ZodIssueCode, ZodError, errorMap, overrideErrorMap, makeIssue, ParseStatus, INVALID, DIRTY, OK, isAborted, isDirty, isValid, isAsync, errorUtil, ParseInputLazyPath, handleResult, ZodType, cuidRegex, cuid2Regex, ulidRegex, uuidRegex, nanoidRegex, jwtRegex, durationRegex, emailRegex, _emojiRegex, emojiRegex, ipv4Regex, ipv4CidrRegex, ipv6Regex, ipv6CidrRegex, base64Regex, base64urlRegex, dateRegexSource, dateRegex, ZodString, ZodNumber, ZodBigInt, ZodBoolean, ZodDate, ZodSymbol, ZodUndefined, ZodNull, ZodAny, ZodUnknown, ZodNever, ZodVoid, ZodArray, ZodObject, ZodUnion, ZodIntersection, ZodTuple, ZodMap, ZodSet, ZodLazy, ZodLiteral, ZodEnum, ZodNativeEnum, ZodPromise, ZodEffects, ZodOptional, ZodNullable, ZodDefault, ZodCatch, ZodNaN, ZodBranded, ZodPipeline, ZodReadonly, ZodFirstPartyTypeKind, enumType, ALGORITHMS, ALGORITHM_VALUES, ALLOWED_DIRECTIVES, ALGORITHM, encoder$1, decoder$1, IV_LENGTH, renderTemplateResultSym, RenderTemplateResult, slotString, SlotString, internalProps, SCRIPT_RE, COMMENT_RE, SCRIPT_REPLACER, COMMENT_REPLACER, ServerIslandComponent, renderServerIslandRuntime, SERVER_ISLAND_REPLACER, Fragment, Renderer, encoder, decoder, astroComponentInstanceSym, AstroComponentInstance, DOCTYPE_EXP, needsHeadRenderingSymbol, rendererAliases, clientOnlyValues, ASTRO_SLOT_EXP, ASTRO_STATIC_SLOT_EXP, ClientOnlyPlaceholder, hasTriedRenderComponentSymbol, cssesc_1, hasRequiredCssesc;
var init_server_BRKsKzpO = __esm({
  "dist/_worker.js/chunks/astro/server_BRKsKzpO.mjs"() {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    globalThis.process ??= {};
    globalThis.process.env ??= {};
    ASTRO_VERSION = "5.13.0";
    REROUTE_DIRECTIVE_HEADER = "X-Astro-Reroute";
    REWRITE_DIRECTIVE_HEADER_KEY = "X-Astro-Rewrite";
    REWRITE_DIRECTIVE_HEADER_VALUE = "yes";
    NOOP_MIDDLEWARE_HEADER = "X-Astro-Noop";
    ROUTE_TYPE_HEADER = "X-Astro-Route-Type";
    DEFAULT_404_COMPONENT = "astro-default-404.astro";
    REDIRECT_STATUS_CODES = [301, 302, 303, 307, 308, 300, 304];
    REROUTABLE_STATUS_CODES = [404, 500];
    clientAddressSymbol = Symbol.for("astro.clientAddress");
    originPathnameSymbol = Symbol.for("astro.originPathname");
    responseSentSymbol = Symbol.for("astro.responseSent");
    __name(normalizeLF, "normalizeLF");
    __name(codeFrame, "codeFrame");
    AstroError = class extends Error {
      static {
        __name(this, "AstroError");
      }
      loc;
      title;
      hint;
      frame;
      type = "AstroError";
      constructor(props, options) {
        const { name, title: title2, message, stack, location, hint, frame } = props;
        super(message, options);
        this.title = title2;
        this.name = name;
        if (message) this.message = message;
        this.stack = stack ? stack : this.stack;
        this.loc = location;
        this.hint = hint;
        this.frame = frame;
      }
      setLocation(location) {
        this.loc = location;
      }
      setName(name) {
        this.name = name;
      }
      setMessage(message) {
        this.message = message;
      }
      setHint(hint) {
        this.hint = hint;
      }
      setFrame(source, location) {
        this.frame = codeFrame(source, location);
      }
      static is(err) {
        return err.type === "AstroError";
      }
    };
    ClientAddressNotAvailable = {
      name: "ClientAddressNotAvailable",
      title: "`Astro.clientAddress` is not available in current adapter.",
      message: /* @__PURE__ */ __name((adapterName) => `\`Astro.clientAddress\` is not available in the \`${adapterName}\` adapter. File an issue with the adapter to add support.`, "message")
    };
    PrerenderClientAddressNotAvailable = {
      name: "PrerenderClientAddressNotAvailable",
      title: "`Astro.clientAddress` cannot be used inside prerendered routes.",
      message: /* @__PURE__ */ __name((name) => `\`Astro.clientAddress\` cannot be used inside prerendered route ${name}`, "message")
    };
    StaticClientAddressNotAvailable = {
      name: "StaticClientAddressNotAvailable",
      title: "`Astro.clientAddress` is not available in prerendered pages.",
      message: "`Astro.clientAddress` is only available on pages that are server-rendered.",
      hint: "See https://docs.astro.build/en/guides/on-demand-rendering/ for more information on how to enable SSR."
    };
    NoMatchingStaticPathFound = {
      name: "NoMatchingStaticPathFound",
      title: "No static path found for requested path.",
      message: /* @__PURE__ */ __name((pathName) => `A \`getStaticPaths()\` route pattern was matched, but no matching static path was found for requested path \`${pathName}\`.`, "message"),
      hint: /* @__PURE__ */ __name((possibleRoutes) => `Possible dynamic routes being matched: ${possibleRoutes.join(", ")}.`, "hint")
    };
    OnlyResponseCanBeReturned = {
      name: "OnlyResponseCanBeReturned",
      title: "Invalid type returned by Astro page.",
      message: /* @__PURE__ */ __name((route, returnedValue) => `Route \`${route ? route : ""}\` returned a \`${returnedValue}\`. Only a [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) can be returned from Astro files.`, "message"),
      hint: "See https://docs.astro.build/en/guides/on-demand-rendering/#response for more information."
    };
    MissingMediaQueryDirective = {
      name: "MissingMediaQueryDirective",
      title: "Missing value for `client:media` directive.",
      message: 'Media query not provided for `client:media` directive. A media query similar to `client:media="(max-width: 600px)"` must be provided'
    };
    NoMatchingRenderer = {
      name: "NoMatchingRenderer",
      title: "No matching renderer found.",
      message: /* @__PURE__ */ __name((componentName, componentExtension, plural, validRenderersCount) => `Unable to render \`${componentName}\`.

${validRenderersCount > 0 ? `There ${plural ? "are" : "is"} ${validRenderersCount} renderer${plural ? "s" : ""} configured in your \`astro.config.mjs\` file,
but ${plural ? "none were" : "it was not"} able to server-side render \`${componentName}\`.` : `No valid renderer was found ${componentExtension ? `for the \`.${componentExtension}\` file extension.` : `for this file extension.`}`}`, "message"),
      hint: /* @__PURE__ */ __name((probableRenderers) => `Did you mean to enable the ${probableRenderers} integration?

See https://docs.astro.build/en/guides/framework-components/ for more information on how to install and configure integrations.`, "hint")
    };
    NoClientOnlyHint = {
      name: "NoClientOnlyHint",
      title: "Missing hint on client:only directive.",
      message: /* @__PURE__ */ __name((componentName) => `Unable to render \`${componentName}\`. When using the \`client:only\` hydration strategy, Astro needs a hint to use the correct renderer.`, "message"),
      hint: /* @__PURE__ */ __name((probableRenderers) => `Did you mean to pass \`client:only="${probableRenderers}"\`? See https://docs.astro.build/en/reference/directives-reference/#clientonly for more information on client:only`, "hint")
    };
    InvalidGetStaticPathsEntry = {
      name: "InvalidGetStaticPathsEntry",
      title: "Invalid entry inside getStaticPath's return value",
      message: /* @__PURE__ */ __name((entryType) => `Invalid entry returned by getStaticPaths. Expected an object, got \`${entryType}\``, "message"),
      hint: "If you're using a `.map` call, you might be looking for `.flatMap()` instead. See https://docs.astro.build/en/reference/routing-reference/#getstaticpaths for more information on getStaticPaths."
    };
    InvalidGetStaticPathsReturn = {
      name: "InvalidGetStaticPathsReturn",
      title: "Invalid value returned by getStaticPaths.",
      message: /* @__PURE__ */ __name((returnType) => `Invalid type returned by \`getStaticPaths\`. Expected an \`array\`, got \`${returnType}\``, "message"),
      hint: "See https://docs.astro.build/en/reference/routing-reference/#getstaticpaths for more information on getStaticPaths."
    };
    GetStaticPathsExpectedParams = {
      name: "GetStaticPathsExpectedParams",
      title: "Missing params property on `getStaticPaths` route.",
      message: "Missing or empty required `params` property on `getStaticPaths` route.",
      hint: "See https://docs.astro.build/en/reference/routing-reference/#getstaticpaths for more information on getStaticPaths."
    };
    GetStaticPathsInvalidRouteParam = {
      name: "GetStaticPathsInvalidRouteParam",
      title: "Invalid value for `getStaticPaths` route parameter.",
      message: /* @__PURE__ */ __name((key, value, valueType) => `Invalid getStaticPaths route parameter for \`${key}\`. Expected undefined, a string or a number, received \`${valueType}\` (\`${value}\`)`, "message"),
      hint: "See https://docs.astro.build/en/reference/routing-reference/#getstaticpaths for more information on getStaticPaths."
    };
    GetStaticPathsRequired = {
      name: "GetStaticPathsRequired",
      title: "`getStaticPaths()` function required for dynamic routes.",
      message: "`getStaticPaths()` function is required for dynamic routes. Make sure that you `export` a `getStaticPaths` function from your dynamic route.",
      hint: `See https://docs.astro.build/en/guides/routing/#dynamic-routes for more information on dynamic routes.

	If you meant for this route to be server-rendered, set \`export const prerender = false;\` in the page.`
    };
    ReservedSlotName = {
      name: "ReservedSlotName",
      title: "Invalid slot name.",
      message: /* @__PURE__ */ __name((slotName) => `Unable to create a slot named \`${slotName}\`. \`${slotName}\` is a reserved slot name. Please update the name of this slot.`, "message")
    };
    NoMatchingImport = {
      name: "NoMatchingImport",
      title: "No import found for component.",
      message: /* @__PURE__ */ __name((componentName) => `Could not render \`${componentName}\`. No matching import has been found for \`${componentName}\`.`, "message"),
      hint: "Please make sure the component is properly imported."
    };
    InvalidComponentArgs = {
      name: "InvalidComponentArgs",
      title: "Invalid component arguments.",
      message: /* @__PURE__ */ __name((name) => `Invalid arguments passed to${name ? ` <${name}>` : ""} component.`, "message"),
      hint: "Astro components cannot be rendered directly via function call, such as `Component()` or `{items.map(Component)}`."
    };
    PageNumberParamNotFound = {
      name: "PageNumberParamNotFound",
      title: "Page number param not found.",
      message: /* @__PURE__ */ __name((paramName) => `[paginate()] page number param \`${paramName}\` not found in your filepath.`, "message"),
      hint: "Rename your file to `[page].astro` or `[...page].astro`."
    };
    PrerenderDynamicEndpointPathCollide = {
      name: "PrerenderDynamicEndpointPathCollide",
      title: "Prerendered dynamic endpoint has path collision.",
      message: /* @__PURE__ */ __name((pathname) => `Could not render \`${pathname}\` with an \`undefined\` param as the generated path will collide during prerendering. Prevent passing \`undefined\` as \`params\` for the endpoint's \`getStaticPaths()\` function, or add an additional extension to the endpoint's filename.`, "message"),
      hint: /* @__PURE__ */ __name((filename) => `Rename \`${filename}\` to \`${filename.replace(/\.(?:js|ts)/, (m) => `.json` + m)}\``, "hint")
    };
    ResponseSentError = {
      name: "ResponseSentError",
      title: "Unable to set response.",
      message: "The response has already been sent to the browser and cannot be altered."
    };
    MiddlewareNoDataOrNextCalled = {
      name: "MiddlewareNoDataOrNextCalled",
      title: "The middleware didn't return a `Response`.",
      message: "Make sure your middleware returns a `Response` object, either directly or by returning the `Response` from calling the `next` function."
    };
    MiddlewareNotAResponse = {
      name: "MiddlewareNotAResponse",
      title: "The middleware returned something that is not a `Response` object.",
      message: "Any data returned from middleware must be a valid `Response` object."
    };
    EndpointDidNotReturnAResponse = {
      name: "EndpointDidNotReturnAResponse",
      title: "The endpoint did not return a `Response`.",
      message: "An endpoint must return either a `Response`, or a `Promise` that resolves with a `Response`."
    };
    LocalsNotAnObject = {
      name: "LocalsNotAnObject",
      title: "Value assigned to `locals` is not accepted.",
      message: "`locals` can only be assigned to an object. Other values like numbers, strings, etc. are not accepted.",
      hint: "If you tried to remove some information from the `locals` object, try to use `delete` or set the property to `undefined`."
    };
    LocalsReassigned = {
      name: "LocalsReassigned",
      title: "`locals` must not be reassigned.",
      message: "`locals` can not be assigned directly.",
      hint: "Set a `locals` property instead."
    };
    AstroResponseHeadersReassigned = {
      name: "AstroResponseHeadersReassigned",
      title: "`Astro.response.headers` must not be reassigned.",
      message: "Individual headers can be added to and removed from `Astro.response.headers`, but it must not be replaced with another instance of `Headers` altogether.",
      hint: "Consider using `Astro.response.headers.add()`, and `Astro.response.headers.delete()`."
    };
    AstroGlobUsedOutside = {
      name: "AstroGlobUsedOutside",
      title: "Astro.glob() used outside of an Astro file.",
      message: /* @__PURE__ */ __name((globStr) => `\`Astro.glob(${globStr})\` can only be used in \`.astro\` files. \`import.meta.glob(${globStr})\` can be used instead to achieve a similar result.`, "message"),
      hint: "See Vite's documentation on `import.meta.glob` for more information: https://vite.dev/guide/features.html#glob-import"
    };
    AstroGlobNoMatch = {
      name: "AstroGlobNoMatch",
      title: "Astro.glob() did not match any files.",
      message: /* @__PURE__ */ __name((globStr) => `\`Astro.glob(${globStr})\` did not return any matching files.`, "message"),
      hint: "Check the pattern for typos."
    };
    i18nNoLocaleFoundInPath = {
      name: "i18nNoLocaleFoundInPath",
      title: "The path doesn't contain any locale",
      message: "You tried to use an i18n utility on a path that doesn't contain any locale. You can use `pathHasLocale` first to determine if the path has a locale."
    };
    RewriteWithBodyUsed = {
      name: "RewriteWithBodyUsed",
      title: "Cannot use Astro.rewrite after the request body has been read",
      message: "Astro.rewrite() cannot be used if the request body has already been read. If you need to read the body, first clone the request."
    };
    ForbiddenRewrite = {
      name: "ForbiddenRewrite",
      title: "Forbidden rewrite to a static route.",
      message: /* @__PURE__ */ __name((from, to, component) => `You tried to rewrite the on-demand route '${from}' with the static route '${to}', when using the 'server' output. 

The static route '${to}' is rendered by the component
'${component}', which is marked as prerendered. This is a forbidden operation because during the build the component '${component}' is compiled to an
HTML file, which can't be retrieved at runtime by Astro.`, "message"),
      hint: /* @__PURE__ */ __name((component) => `Add \`export const prerender = false\` to the component '${component}', or use a Astro.redirect().`, "hint")
    };
    CspNotEnabled = {
      name: "CspNotEnabled",
      title: "CSP feature isn't enabled",
      message: "The `experimental.csp` configuration isn't enabled."
    };
    ActionsReturnedInvalidDataError = {
      name: "ActionsReturnedInvalidDataError",
      title: "Action handler returned invalid data.",
      message: /* @__PURE__ */ __name((error4) => `Action handler returned invalid data. Handlers should return serializable data types like objects, arrays, strings, and numbers. Parse error: ${error4}`, "message"),
      hint: "See the devalue library for all supported types: https://github.com/rich-harris/devalue"
    };
    ActionNotFoundError = {
      name: "ActionNotFoundError",
      title: "Action not found.",
      message: /* @__PURE__ */ __name((actionName) => `The server received a request for an action named \`${actionName}\` but could not find a match. If you renamed an action, check that you've updated your \`actions/index\` file and your calling code to match.`, "message"),
      hint: "You can run `astro check` to detect type errors caused by mismatched action names."
    };
    SessionStorageInitError = {
      name: "SessionStorageInitError",
      title: "Session storage could not be initialized.",
      message: /* @__PURE__ */ __name((error4, driver) => `Error when initializing session storage${driver ? ` with driver \`${driver}\`` : ""}. \`${error4 ?? ""}\``, "message"),
      hint: "For more information, see https://docs.astro.build/en/guides/sessions/"
    };
    SessionStorageSaveError = {
      name: "SessionStorageSaveError",
      title: "Session data could not be saved.",
      message: /* @__PURE__ */ __name((error4, driver) => `Error when saving session data${driver ? ` with driver \`${driver}\`` : ""}. \`${error4 ?? ""}\``, "message"),
      hint: "For more information, see https://docs.astro.build/en/guides/sessions/"
    };
    __name(validateArgs, "validateArgs");
    __name(baseCreateComponent, "baseCreateComponent");
    __name(createComponentWithOptions, "createComponentWithOptions");
    __name(createComponent, "createComponent");
    __name(createAstroGlobFn, "createAstroGlobFn");
    __name(createAstro, "createAstro");
    isTTY = true;
    if (typeof process !== "undefined") {
      ({ FORCE_COLOR, NODE_DISABLE_COLORS, NO_COLOR, TERM } = process.env || {});
      isTTY = process.stdout && process.stdout.isTTY;
    }
    $ = {
      enabled: !NODE_DISABLE_COLORS && NO_COLOR == null && TERM !== "dumb" && (FORCE_COLOR != null && FORCE_COLOR !== "0" || isTTY)
    };
    __name(init, "init");
    bold = init(1, 22);
    dim = init(2, 22);
    red = init(31, 39);
    green = init(32, 39);
    yellow = init(33, 39);
    blue = init(34, 39);
    __name(renderEndpoint, "renderEndpoint");
    ({ replace } = "");
    ca = /[&<>'"]/g;
    esca = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;"
    };
    pe = /* @__PURE__ */ __name((m) => esca[m], "pe");
    escape = /* @__PURE__ */ __name((es) => replace.call(es, ca, pe), "escape");
    __name(isPromise, "isPromise");
    __name(streamAsyncIterator, "streamAsyncIterator");
    escapeHTML = escape;
    HTMLBytes = class extends Uint8Array {
      static {
        __name(this, "HTMLBytes");
      }
    };
    Object.defineProperty(HTMLBytes.prototype, Symbol.toStringTag, {
      get() {
        return "HTMLBytes";
      }
    });
    HTMLString = class extends String {
      static {
        __name(this, "HTMLString");
      }
      get [Symbol.toStringTag]() {
        return "HTMLString";
      }
    };
    markHTMLString = /* @__PURE__ */ __name((value) => {
      if (value instanceof HTMLString) {
        return value;
      }
      if (typeof value === "string") {
        return new HTMLString(value);
      }
      return value;
    }, "markHTMLString");
    __name(isHTMLString, "isHTMLString");
    __name(markHTMLBytes, "markHTMLBytes");
    __name(hasGetReader, "hasGetReader");
    __name(unescapeChunksAsync, "unescapeChunksAsync");
    __name(unescapeChunks, "unescapeChunks");
    __name(unescapeHTML, "unescapeHTML");
    AstroJSX = "astro:jsx";
    __name(isVNode, "isVNode");
    __name(isAstroComponentFactory, "isAstroComponentFactory");
    __name(isAPropagatingComponent, "isAPropagatingComponent");
    __name(getPropagationHint, "getPropagationHint");
    __name(r, "r");
    __name(clsx, "clsx");
    PROP_TYPE = {
      Value: 0,
      JSON: 1,
      // Actually means Array
      RegExp: 2,
      Date: 3,
      Map: 4,
      Set: 5,
      BigInt: 6,
      URL: 7,
      Uint8Array: 8,
      Uint16Array: 9,
      Uint32Array: 10,
      Infinity: 11
    };
    __name(serializeArray, "serializeArray");
    __name(serializeObject, "serializeObject");
    __name(convertToSerializedForm, "convertToSerializedForm");
    __name(serializeProps, "serializeProps");
    transitionDirectivesToCopyOnIsland = Object.freeze([
      "data-astro-transition-scope",
      "data-astro-transition-persist",
      "data-astro-transition-persist-props"
    ]);
    __name(extractDirectives, "extractDirectives");
    __name(generateHydrateScript, "generateHydrateScript");
    dictionary = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXY";
    binary = dictionary.length;
    __name(bitwise, "bitwise");
    __name(shorthash, "shorthash");
    headAndContentSym = Symbol.for("astro.headAndContent");
    __name(isHeadAndContent, "isHeadAndContent");
    __name(createThinHead, "createThinHead");
    astro_island_prebuilt_default = `(()=>{var A=Object.defineProperty;var g=(i,o,a)=>o in i?A(i,o,{enumerable:!0,configurable:!0,writable:!0,value:a}):i[o]=a;var d=(i,o,a)=>g(i,typeof o!="symbol"?o+"":o,a);{let i={0:t=>m(t),1:t=>a(t),2:t=>new RegExp(t),3:t=>new Date(t),4:t=>new Map(a(t)),5:t=>new Set(a(t)),6:t=>BigInt(t),7:t=>new URL(t),8:t=>new Uint8Array(t),9:t=>new Uint16Array(t),10:t=>new Uint32Array(t),11:t=>1/0*t},o=t=>{let[l,e]=t;return l in i?i[l](e):void 0},a=t=>t.map(o),m=t=>typeof t!="object"||t===null?t:Object.fromEntries(Object.entries(t).map(([l,e])=>[l,o(e)]));class y extends HTMLElement{constructor(){super(...arguments);d(this,"Component");d(this,"hydrator");d(this,"hydrate",async()=>{var b;if(!this.hydrator||!this.isConnected)return;let e=(b=this.parentElement)==null?void 0:b.closest("astro-island[ssr]");if(e){e.addEventListener("astro:hydrate",this.hydrate,{once:!0});return}let c=this.querySelectorAll("astro-slot"),n={},h=this.querySelectorAll("template[data-astro-template]");for(let r of h){let s=r.closest(this.tagName);s!=null&&s.isSameNode(this)&&(n[r.getAttribute("data-astro-template")||"default"]=r.innerHTML,r.remove())}for(let r of c){let s=r.closest(this.tagName);s!=null&&s.isSameNode(this)&&(n[r.getAttribute("name")||"default"]=r.innerHTML)}let p;try{p=this.hasAttribute("props")?m(JSON.parse(this.getAttribute("props"))):{}}catch(r){let s=this.getAttribute("component-url")||"<unknown>",v=this.getAttribute("component-export");throw v&&(s+=\` (export \${v})\`),console.error(\`[hydrate] Error parsing props for component \${s}\`,this.getAttribute("props"),r),r}let u;await this.hydrator(this)(this.Component,p,n,{client:this.getAttribute("client")}),this.removeAttribute("ssr"),this.dispatchEvent(new CustomEvent("astro:hydrate"))});d(this,"unmount",()=>{this.isConnected||this.dispatchEvent(new CustomEvent("astro:unmount"))})}disconnectedCallback(){document.removeEventListener("astro:after-swap",this.unmount),document.addEventListener("astro:after-swap",this.unmount,{once:!0})}connectedCallback(){if(!this.hasAttribute("await-children")||document.readyState==="interactive"||document.readyState==="complete")this.childrenConnectedCallback();else{let e=()=>{document.removeEventListener("DOMContentLoaded",e),c.disconnect(),this.childrenConnectedCallback()},c=new MutationObserver(()=>{var n;((n=this.lastChild)==null?void 0:n.nodeType)===Node.COMMENT_NODE&&this.lastChild.nodeValue==="astro:end"&&(this.lastChild.remove(),e())});c.observe(this,{childList:!0}),document.addEventListener("DOMContentLoaded",e)}}async childrenConnectedCallback(){let e=this.getAttribute("before-hydration-url");e&&await import(e),this.start()}async start(){let e=JSON.parse(this.getAttribute("opts")),c=this.getAttribute("client");if(Astro[c]===void 0){window.addEventListener(\`astro:\${c}\`,()=>this.start(),{once:!0});return}try{await Astro[c](async()=>{let n=this.getAttribute("renderer-url"),[h,{default:p}]=await Promise.all([import(this.getAttribute("component-url")),n?import(n):()=>()=>{}]),u=this.getAttribute("component-export")||"default";if(!u.includes("."))this.Component=h[u];else{this.Component=h;for(let f of u.split("."))this.Component=this.Component[f]}return this.hydrator=p,this.hydrate},e,this)}catch(n){console.error(\`[astro-island] Error hydrating \${this.getAttribute("component-url")}\`,n)}}attributeChangedCallback(){this.hydrate()}}d(y,"observedAttributes",["props"]),customElements.get("astro-island")||customElements.define("astro-island",y)}})();`;
    ISLAND_STYLES = "astro-island,astro-slot,astro-static-slot{display:contents}";
    __name(determineIfNeedsHydrationScript, "determineIfNeedsHydrationScript");
    __name(determinesIfNeedsDirectiveScript, "determinesIfNeedsDirectiveScript");
    __name(getDirectiveScriptText, "getDirectiveScriptText");
    __name(getPrescripts, "getPrescripts");
    __name(renderCspContent, "renderCspContent");
    RenderInstructionSymbol = Symbol.for("astro:render");
    __name(createRenderInstruction, "createRenderInstruction");
    __name(isRenderInstruction, "isRenderInstruction");
    voidElementNames = /^(area|base|br|col|command|embed|hr|img|input|keygen|link|meta|param|source|track|wbr)$/i;
    htmlBooleanAttributes = /^(?:allowfullscreen|async|autofocus|autoplay|checked|controls|default|defer|disabled|disablepictureinpicture|disableremoteplayback|formnovalidate|hidden|inert|loop|nomodule|novalidate|open|playsinline|readonly|required|reversed|scoped|seamless|selected|itemscope)$/i;
    AMPERSAND_REGEX = /&/g;
    DOUBLE_QUOTE_REGEX = /"/g;
    STATIC_DIRECTIVES = /* @__PURE__ */ new Set(["set:html", "set:text"]);
    toIdent = /* @__PURE__ */ __name((k) => k.trim().replace(/(?!^)\b\w|\s+|\W+/g, (match, index) => {
      if (/\W/.test(match)) return "";
      return index === 0 ? match : match.toUpperCase();
    }), "toIdent");
    toAttributeString = /* @__PURE__ */ __name((value, shouldEscape = true) => shouldEscape ? String(value).replace(AMPERSAND_REGEX, "&#38;").replace(DOUBLE_QUOTE_REGEX, "&#34;") : value, "toAttributeString");
    kebab = /* @__PURE__ */ __name((k) => k.toLowerCase() === k ? k : k.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`), "kebab");
    toStyleString = /* @__PURE__ */ __name((obj) => Object.entries(obj).filter(([_, v]) => typeof v === "string" && v.trim() || typeof v === "number").map(([k, v]) => {
      if (k[0] !== "-" && k[1] !== "-") return `${kebab(k)}:${v}`;
      return `${k}:${v}`;
    }).join(";"), "toStyleString");
    __name(defineScriptVars, "defineScriptVars");
    __name(formatList, "formatList");
    __name(isCustomElement, "isCustomElement");
    __name(handleBooleanAttribute, "handleBooleanAttribute");
    __name(addAttribute, "addAttribute");
    __name(internalSpreadAttributes, "internalSpreadAttributes");
    __name(renderElement$1, "renderElement$1");
    noop = /* @__PURE__ */ __name(() => {
    }, "noop");
    BufferedRenderer = class {
      static {
        __name(this, "BufferedRenderer");
      }
      chunks = [];
      renderPromise;
      destination;
      /**
       * Determines whether buffer has been flushed
       * to the final destination.
       */
      flushed = false;
      constructor(destination, renderFunction) {
        this.destination = destination;
        this.renderPromise = renderFunction(this);
        if (isPromise(this.renderPromise)) {
          Promise.resolve(this.renderPromise).catch(noop);
        }
      }
      write(chunk) {
        if (this.flushed) {
          this.destination.write(chunk);
        } else {
          this.chunks.push(chunk);
        }
      }
      flush() {
        if (this.flushed) {
          throw new Error("The render buffer has already been flushed.");
        }
        this.flushed = true;
        for (const chunk of this.chunks) {
          this.destination.write(chunk);
        }
        return this.renderPromise;
      }
    };
    __name(createBufferedRenderer, "createBufferedRenderer");
    isNode = typeof process !== "undefined" && Object.prototype.toString.call(process) === "[object process]";
    isDeno = typeof Deno !== "undefined";
    __name(promiseWithResolvers, "promiseWithResolvers");
    VALID_PROTOCOLS = ["http:", "https:"];
    __name(isHttpUrl, "isHttpUrl");
    uniqueElements = /* @__PURE__ */ __name((item, index, all) => {
      const props = JSON.stringify(item.props);
      const children = item.children;
      return index === all.findIndex((i) => JSON.stringify(i.props) === props && i.children == children);
    }, "uniqueElements");
    __name(renderAllHeadContent, "renderAllHeadContent");
    __name(renderHead, "renderHead");
    __name(maybeRenderHead, "maybeRenderHead");
    __name(encodeHexUpperCase, "encodeHexUpperCase");
    __name(decodeHex, "decodeHex");
    alphabetUpperCase = "0123456789ABCDEF";
    decodeMap = {
      "0": 0,
      "1": 1,
      "2": 2,
      "3": 3,
      "4": 4,
      "5": 5,
      "6": 6,
      "7": 7,
      "8": 8,
      "9": 9,
      a: 10,
      A: 10,
      b: 11,
      B: 11,
      c: 12,
      C: 12,
      d: 13,
      D: 13,
      e: 14,
      E: 14,
      f: 15,
      F: 15
    };
    (function(EncodingPadding2) {
      EncodingPadding2[EncodingPadding2["Include"] = 0] = "Include";
      EncodingPadding2[EncodingPadding2["None"] = 1] = "None";
    })(EncodingPadding$1 || (EncodingPadding$1 = {}));
    (function(DecodingPadding2) {
      DecodingPadding2[DecodingPadding2["Required"] = 0] = "Required";
      DecodingPadding2[DecodingPadding2["Ignore"] = 1] = "Ignore";
    })(DecodingPadding$1 || (DecodingPadding$1 = {}));
    __name(encodeBase64, "encodeBase64");
    __name(encodeBase64_internal, "encodeBase64_internal");
    base64Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    __name(decodeBase64, "decodeBase64");
    __name(decodeBase64_internal, "decodeBase64_internal");
    (function(EncodingPadding2) {
      EncodingPadding2[EncodingPadding2["Include"] = 0] = "Include";
      EncodingPadding2[EncodingPadding2["None"] = 1] = "None";
    })(EncodingPadding || (EncodingPadding = {}));
    (function(DecodingPadding2) {
      DecodingPadding2[DecodingPadding2["Required"] = 0] = "Required";
      DecodingPadding2[DecodingPadding2["Ignore"] = 1] = "Ignore";
    })(DecodingPadding || (DecodingPadding = {}));
    base64DecodeMap = {
      "0": 52,
      "1": 53,
      "2": 54,
      "3": 55,
      "4": 56,
      "5": 57,
      "6": 58,
      "7": 59,
      "8": 60,
      "9": 61,
      A: 0,
      B: 1,
      C: 2,
      D: 3,
      E: 4,
      F: 5,
      G: 6,
      H: 7,
      I: 8,
      J: 9,
      K: 10,
      L: 11,
      M: 12,
      N: 13,
      O: 14,
      P: 15,
      Q: 16,
      R: 17,
      S: 18,
      T: 19,
      U: 20,
      V: 21,
      W: 22,
      X: 23,
      Y: 24,
      Z: 25,
      a: 26,
      b: 27,
      c: 28,
      d: 29,
      e: 30,
      f: 31,
      g: 32,
      h: 33,
      i: 34,
      j: 35,
      k: 36,
      l: 37,
      m: 38,
      n: 39,
      o: 40,
      p: 41,
      q: 42,
      r: 43,
      s: 44,
      t: 45,
      u: 46,
      v: 47,
      w: 48,
      x: 49,
      y: 50,
      z: 51,
      "+": 62,
      "/": 63
    };
    (function(util2) {
      util2.assertEqual = (_) => {
      };
      function assertIs(_arg) {
      }
      __name(assertIs, "assertIs");
      util2.assertIs = assertIs;
      function assertNever(_x) {
        throw new Error();
      }
      __name(assertNever, "assertNever");
      util2.assertNever = assertNever;
      util2.arrayToEnum = (items) => {
        const obj = {};
        for (const item of items) {
          obj[item] = item;
        }
        return obj;
      };
      util2.getValidEnumValues = (obj) => {
        const validKeys = util2.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
        const filtered = {};
        for (const k of validKeys) {
          filtered[k] = obj[k];
        }
        return util2.objectValues(filtered);
      };
      util2.objectValues = (obj) => {
        return util2.objectKeys(obj).map(function(e) {
          return obj[e];
        });
      };
      util2.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object) => {
        const keys = [];
        for (const key in object) {
          if (Object.prototype.hasOwnProperty.call(object, key)) {
            keys.push(key);
          }
        }
        return keys;
      };
      util2.find = (arr, checker) => {
        for (const item of arr) {
          if (checker(item))
            return item;
        }
        return void 0;
      };
      util2.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && Number.isFinite(val) && Math.floor(val) === val;
      function joinValues(array, separator = " | ") {
        return array.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator);
      }
      __name(joinValues, "joinValues");
      util2.joinValues = joinValues;
      util2.jsonStringifyReplacer = (_, value) => {
        if (typeof value === "bigint") {
          return value.toString();
        }
        return value;
      };
    })(util || (util = {}));
    (function(objectUtil2) {
      objectUtil2.mergeShapes = (first, second) => {
        return {
          ...first,
          ...second
          // second overwrites first
        };
      };
    })(objectUtil || (objectUtil = {}));
    ZodParsedType = util.arrayToEnum([
      "string",
      "nan",
      "number",
      "integer",
      "float",
      "boolean",
      "date",
      "bigint",
      "symbol",
      "function",
      "undefined",
      "null",
      "array",
      "object",
      "unknown",
      "promise",
      "void",
      "never",
      "map",
      "set"
    ]);
    getParsedType = /* @__PURE__ */ __name((data) => {
      const t = typeof data;
      switch (t) {
        case "undefined":
          return ZodParsedType.undefined;
        case "string":
          return ZodParsedType.string;
        case "number":
          return Number.isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
        case "boolean":
          return ZodParsedType.boolean;
        case "function":
          return ZodParsedType.function;
        case "bigint":
          return ZodParsedType.bigint;
        case "symbol":
          return ZodParsedType.symbol;
        case "object":
          if (Array.isArray(data)) {
            return ZodParsedType.array;
          }
          if (data === null) {
            return ZodParsedType.null;
          }
          if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
            return ZodParsedType.promise;
          }
          if (typeof Map !== "undefined" && data instanceof Map) {
            return ZodParsedType.map;
          }
          if (typeof Set !== "undefined" && data instanceof Set) {
            return ZodParsedType.set;
          }
          if (typeof Date !== "undefined" && data instanceof Date) {
            return ZodParsedType.date;
          }
          return ZodParsedType.object;
        default:
          return ZodParsedType.unknown;
      }
    }, "getParsedType");
    ZodIssueCode = util.arrayToEnum([
      "invalid_type",
      "invalid_literal",
      "custom",
      "invalid_union",
      "invalid_union_discriminator",
      "invalid_enum_value",
      "unrecognized_keys",
      "invalid_arguments",
      "invalid_return_type",
      "invalid_date",
      "invalid_string",
      "too_small",
      "too_big",
      "invalid_intersection_types",
      "not_multiple_of",
      "not_finite"
    ]);
    ZodError = class _ZodError extends Error {
      static {
        __name(this, "ZodError");
      }
      get errors() {
        return this.issues;
      }
      constructor(issues) {
        super();
        this.issues = [];
        this.addIssue = (sub) => {
          this.issues = [...this.issues, sub];
        };
        this.addIssues = (subs = []) => {
          this.issues = [...this.issues, ...subs];
        };
        const actualProto = new.target.prototype;
        if (Object.setPrototypeOf) {
          Object.setPrototypeOf(this, actualProto);
        } else {
          this.__proto__ = actualProto;
        }
        this.name = "ZodError";
        this.issues = issues;
      }
      format(_mapper) {
        const mapper = _mapper || function(issue) {
          return issue.message;
        };
        const fieldErrors = { _errors: [] };
        const processError = /* @__PURE__ */ __name((error4) => {
          for (const issue of error4.issues) {
            if (issue.code === "invalid_union") {
              issue.unionErrors.map(processError);
            } else if (issue.code === "invalid_return_type") {
              processError(issue.returnTypeError);
            } else if (issue.code === "invalid_arguments") {
              processError(issue.argumentsError);
            } else if (issue.path.length === 0) {
              fieldErrors._errors.push(mapper(issue));
            } else {
              let curr = fieldErrors;
              let i = 0;
              while (i < issue.path.length) {
                const el = issue.path[i];
                const terminal = i === issue.path.length - 1;
                if (!terminal) {
                  curr[el] = curr[el] || { _errors: [] };
                } else {
                  curr[el] = curr[el] || { _errors: [] };
                  curr[el]._errors.push(mapper(issue));
                }
                curr = curr[el];
                i++;
              }
            }
          }
        }, "processError");
        processError(this);
        return fieldErrors;
      }
      static assert(value) {
        if (!(value instanceof _ZodError)) {
          throw new Error(`Not a ZodError: ${value}`);
        }
      }
      toString() {
        return this.message;
      }
      get message() {
        return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
      }
      get isEmpty() {
        return this.issues.length === 0;
      }
      flatten(mapper = (issue) => issue.message) {
        const fieldErrors = {};
        const formErrors = [];
        for (const sub of this.issues) {
          if (sub.path.length > 0) {
            const firstEl = sub.path[0];
            fieldErrors[firstEl] = fieldErrors[firstEl] || [];
            fieldErrors[firstEl].push(mapper(sub));
          } else {
            formErrors.push(mapper(sub));
          }
        }
        return { formErrors, fieldErrors };
      }
      get formErrors() {
        return this.flatten();
      }
    };
    ZodError.create = (issues) => {
      const error4 = new ZodError(issues);
      return error4;
    };
    errorMap = /* @__PURE__ */ __name((issue, _ctx) => {
      let message;
      switch (issue.code) {
        case ZodIssueCode.invalid_type:
          if (issue.received === ZodParsedType.undefined) {
            message = "Required";
          } else {
            message = `Expected ${issue.expected}, received ${issue.received}`;
          }
          break;
        case ZodIssueCode.invalid_literal:
          message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
          break;
        case ZodIssueCode.unrecognized_keys:
          message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
          break;
        case ZodIssueCode.invalid_union:
          message = `Invalid input`;
          break;
        case ZodIssueCode.invalid_union_discriminator:
          message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
          break;
        case ZodIssueCode.invalid_enum_value:
          message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
          break;
        case ZodIssueCode.invalid_arguments:
          message = `Invalid function arguments`;
          break;
        case ZodIssueCode.invalid_return_type:
          message = `Invalid function return type`;
          break;
        case ZodIssueCode.invalid_date:
          message = `Invalid date`;
          break;
        case ZodIssueCode.invalid_string:
          if (typeof issue.validation === "object") {
            if ("includes" in issue.validation) {
              message = `Invalid input: must include "${issue.validation.includes}"`;
              if (typeof issue.validation.position === "number") {
                message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
              }
            } else if ("startsWith" in issue.validation) {
              message = `Invalid input: must start with "${issue.validation.startsWith}"`;
            } else if ("endsWith" in issue.validation) {
              message = `Invalid input: must end with "${issue.validation.endsWith}"`;
            } else {
              util.assertNever(issue.validation);
            }
          } else if (issue.validation !== "regex") {
            message = `Invalid ${issue.validation}`;
          } else {
            message = "Invalid";
          }
          break;
        case ZodIssueCode.too_small:
          if (issue.type === "array")
            message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
          else if (issue.type === "string")
            message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
          else if (issue.type === "number")
            message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
          else if (issue.type === "bigint")
            message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
          else if (issue.type === "date")
            message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
          else
            message = "Invalid input";
          break;
        case ZodIssueCode.too_big:
          if (issue.type === "array")
            message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
          else if (issue.type === "string")
            message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
          else if (issue.type === "number")
            message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
          else if (issue.type === "bigint")
            message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
          else if (issue.type === "date")
            message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
          else
            message = "Invalid input";
          break;
        case ZodIssueCode.custom:
          message = `Invalid input`;
          break;
        case ZodIssueCode.invalid_intersection_types:
          message = `Intersection results could not be merged`;
          break;
        case ZodIssueCode.not_multiple_of:
          message = `Number must be a multiple of ${issue.multipleOf}`;
          break;
        case ZodIssueCode.not_finite:
          message = "Number must be finite";
          break;
        default:
          message = _ctx.defaultError;
          util.assertNever(issue);
      }
      return { message };
    }, "errorMap");
    overrideErrorMap = errorMap;
    __name(getErrorMap, "getErrorMap");
    makeIssue = /* @__PURE__ */ __name((params) => {
      const { data, path, errorMaps, issueData } = params;
      const fullPath = [...path, ...issueData.path || []];
      const fullIssue = {
        ...issueData,
        path: fullPath
      };
      if (issueData.message !== void 0) {
        return {
          ...issueData,
          path: fullPath,
          message: issueData.message
        };
      }
      let errorMessage = "";
      const maps = errorMaps.filter((m) => !!m).slice().reverse();
      for (const map of maps) {
        errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
      }
      return {
        ...issueData,
        path: fullPath,
        message: errorMessage
      };
    }, "makeIssue");
    __name(addIssueToContext, "addIssueToContext");
    ParseStatus = class _ParseStatus {
      static {
        __name(this, "ParseStatus");
      }
      constructor() {
        this.value = "valid";
      }
      dirty() {
        if (this.value === "valid")
          this.value = "dirty";
      }
      abort() {
        if (this.value !== "aborted")
          this.value = "aborted";
      }
      static mergeArray(status, results) {
        const arrayValue = [];
        for (const s of results) {
          if (s.status === "aborted")
            return INVALID;
          if (s.status === "dirty")
            status.dirty();
          arrayValue.push(s.value);
        }
        return { status: status.value, value: arrayValue };
      }
      static async mergeObjectAsync(status, pairs) {
        const syncPairs = [];
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          syncPairs.push({
            key,
            value
          });
        }
        return _ParseStatus.mergeObjectSync(status, syncPairs);
      }
      static mergeObjectSync(status, pairs) {
        const finalObject = {};
        for (const pair of pairs) {
          const { key, value } = pair;
          if (key.status === "aborted")
            return INVALID;
          if (value.status === "aborted")
            return INVALID;
          if (key.status === "dirty")
            status.dirty();
          if (value.status === "dirty")
            status.dirty();
          if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) {
            finalObject[key.value] = value.value;
          }
        }
        return { status: status.value, value: finalObject };
      }
    };
    INVALID = Object.freeze({
      status: "aborted"
    });
    DIRTY = /* @__PURE__ */ __name((value) => ({ status: "dirty", value }), "DIRTY");
    OK = /* @__PURE__ */ __name((value) => ({ status: "valid", value }), "OK");
    isAborted = /* @__PURE__ */ __name((x) => x.status === "aborted", "isAborted");
    isDirty = /* @__PURE__ */ __name((x) => x.status === "dirty", "isDirty");
    isValid = /* @__PURE__ */ __name((x) => x.status === "valid", "isValid");
    isAsync = /* @__PURE__ */ __name((x) => typeof Promise !== "undefined" && x instanceof Promise, "isAsync");
    (function(errorUtil2) {
      errorUtil2.errToObj = (message) => typeof message === "string" ? { message } : message || {};
      errorUtil2.toString = (message) => typeof message === "string" ? message : message?.message;
    })(errorUtil || (errorUtil = {}));
    ParseInputLazyPath = class {
      static {
        __name(this, "ParseInputLazyPath");
      }
      constructor(parent, value, path, key) {
        this._cachedPath = [];
        this.parent = parent;
        this.data = value;
        this._path = path;
        this._key = key;
      }
      get path() {
        if (!this._cachedPath.length) {
          if (Array.isArray(this._key)) {
            this._cachedPath.push(...this._path, ...this._key);
          } else {
            this._cachedPath.push(...this._path, this._key);
          }
        }
        return this._cachedPath;
      }
    };
    handleResult = /* @__PURE__ */ __name((ctx, result) => {
      if (isValid(result)) {
        return { success: true, data: result.value };
      } else {
        if (!ctx.common.issues.length) {
          throw new Error("Validation failed but no issues detected.");
        }
        return {
          success: false,
          get error() {
            if (this._error)
              return this._error;
            const error4 = new ZodError(ctx.common.issues);
            this._error = error4;
            return this._error;
          }
        };
      }
    }, "handleResult");
    __name(processCreateParams, "processCreateParams");
    ZodType = class {
      static {
        __name(this, "ZodType");
      }
      get description() {
        return this._def.description;
      }
      _getType(input) {
        return getParsedType(input.data);
      }
      _getOrReturnCtx(input, ctx) {
        return ctx || {
          common: input.parent.common,
          data: input.data,
          parsedType: getParsedType(input.data),
          schemaErrorMap: this._def.errorMap,
          path: input.path,
          parent: input.parent
        };
      }
      _processInputParams(input) {
        return {
          status: new ParseStatus(),
          ctx: {
            common: input.parent.common,
            data: input.data,
            parsedType: getParsedType(input.data),
            schemaErrorMap: this._def.errorMap,
            path: input.path,
            parent: input.parent
          }
        };
      }
      _parseSync(input) {
        const result = this._parse(input);
        if (isAsync(result)) {
          throw new Error("Synchronous parse encountered promise.");
        }
        return result;
      }
      _parseAsync(input) {
        const result = this._parse(input);
        return Promise.resolve(result);
      }
      parse(data, params) {
        const result = this.safeParse(data, params);
        if (result.success)
          return result.data;
        throw result.error;
      }
      safeParse(data, params) {
        const ctx = {
          common: {
            issues: [],
            async: params?.async ?? false,
            contextualErrorMap: params?.errorMap
          },
          path: params?.path || [],
          schemaErrorMap: this._def.errorMap,
          parent: null,
          data,
          parsedType: getParsedType(data)
        };
        const result = this._parseSync({ data, path: ctx.path, parent: ctx });
        return handleResult(ctx, result);
      }
      "~validate"(data) {
        const ctx = {
          common: {
            issues: [],
            async: !!this["~standard"].async
          },
          path: [],
          schemaErrorMap: this._def.errorMap,
          parent: null,
          data,
          parsedType: getParsedType(data)
        };
        if (!this["~standard"].async) {
          try {
            const result = this._parseSync({ data, path: [], parent: ctx });
            return isValid(result) ? {
              value: result.value
            } : {
              issues: ctx.common.issues
            };
          } catch (err) {
            if (err?.message?.toLowerCase()?.includes("encountered")) {
              this["~standard"].async = true;
            }
            ctx.common = {
              issues: [],
              async: true
            };
          }
        }
        return this._parseAsync({ data, path: [], parent: ctx }).then((result) => isValid(result) ? {
          value: result.value
        } : {
          issues: ctx.common.issues
        });
      }
      async parseAsync(data, params) {
        const result = await this.safeParseAsync(data, params);
        if (result.success)
          return result.data;
        throw result.error;
      }
      async safeParseAsync(data, params) {
        const ctx = {
          common: {
            issues: [],
            contextualErrorMap: params?.errorMap,
            async: true
          },
          path: params?.path || [],
          schemaErrorMap: this._def.errorMap,
          parent: null,
          data,
          parsedType: getParsedType(data)
        };
        const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
        const result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
        return handleResult(ctx, result);
      }
      refine(check, message) {
        const getIssueProperties = /* @__PURE__ */ __name((val) => {
          if (typeof message === "string" || typeof message === "undefined") {
            return { message };
          } else if (typeof message === "function") {
            return message(val);
          } else {
            return message;
          }
        }, "getIssueProperties");
        return this._refinement((val, ctx) => {
          const result = check(val);
          const setError = /* @__PURE__ */ __name(() => ctx.addIssue({
            code: ZodIssueCode.custom,
            ...getIssueProperties(val)
          }), "setError");
          if (typeof Promise !== "undefined" && result instanceof Promise) {
            return result.then((data) => {
              if (!data) {
                setError();
                return false;
              } else {
                return true;
              }
            });
          }
          if (!result) {
            setError();
            return false;
          } else {
            return true;
          }
        });
      }
      refinement(check, refinementData) {
        return this._refinement((val, ctx) => {
          if (!check(val)) {
            ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
            return false;
          } else {
            return true;
          }
        });
      }
      _refinement(refinement) {
        return new ZodEffects({
          schema: this,
          typeName: ZodFirstPartyTypeKind.ZodEffects,
          effect: { type: "refinement", refinement }
        });
      }
      superRefine(refinement) {
        return this._refinement(refinement);
      }
      constructor(def) {
        this.spa = this.safeParseAsync;
        this._def = def;
        this.parse = this.parse.bind(this);
        this.safeParse = this.safeParse.bind(this);
        this.parseAsync = this.parseAsync.bind(this);
        this.safeParseAsync = this.safeParseAsync.bind(this);
        this.spa = this.spa.bind(this);
        this.refine = this.refine.bind(this);
        this.refinement = this.refinement.bind(this);
        this.superRefine = this.superRefine.bind(this);
        this.optional = this.optional.bind(this);
        this.nullable = this.nullable.bind(this);
        this.nullish = this.nullish.bind(this);
        this.array = this.array.bind(this);
        this.promise = this.promise.bind(this);
        this.or = this.or.bind(this);
        this.and = this.and.bind(this);
        this.transform = this.transform.bind(this);
        this.brand = this.brand.bind(this);
        this.default = this.default.bind(this);
        this.catch = this.catch.bind(this);
        this.describe = this.describe.bind(this);
        this.pipe = this.pipe.bind(this);
        this.readonly = this.readonly.bind(this);
        this.isNullable = this.isNullable.bind(this);
        this.isOptional = this.isOptional.bind(this);
        this["~standard"] = {
          version: 1,
          vendor: "zod",
          validate: /* @__PURE__ */ __name((data) => this["~validate"](data), "validate")
        };
      }
      optional() {
        return ZodOptional.create(this, this._def);
      }
      nullable() {
        return ZodNullable.create(this, this._def);
      }
      nullish() {
        return this.nullable().optional();
      }
      array() {
        return ZodArray.create(this);
      }
      promise() {
        return ZodPromise.create(this, this._def);
      }
      or(option) {
        return ZodUnion.create([this, option], this._def);
      }
      and(incoming) {
        return ZodIntersection.create(this, incoming, this._def);
      }
      transform(transform) {
        return new ZodEffects({
          ...processCreateParams(this._def),
          schema: this,
          typeName: ZodFirstPartyTypeKind.ZodEffects,
          effect: { type: "transform", transform }
        });
      }
      default(def) {
        const defaultValueFunc = typeof def === "function" ? def : () => def;
        return new ZodDefault({
          ...processCreateParams(this._def),
          innerType: this,
          defaultValue: defaultValueFunc,
          typeName: ZodFirstPartyTypeKind.ZodDefault
        });
      }
      brand() {
        return new ZodBranded({
          typeName: ZodFirstPartyTypeKind.ZodBranded,
          type: this,
          ...processCreateParams(this._def)
        });
      }
      catch(def) {
        const catchValueFunc = typeof def === "function" ? def : () => def;
        return new ZodCatch({
          ...processCreateParams(this._def),
          innerType: this,
          catchValue: catchValueFunc,
          typeName: ZodFirstPartyTypeKind.ZodCatch
        });
      }
      describe(description) {
        const This = this.constructor;
        return new This({
          ...this._def,
          description
        });
      }
      pipe(target) {
        return ZodPipeline.create(this, target);
      }
      readonly() {
        return ZodReadonly.create(this);
      }
      isOptional() {
        return this.safeParse(void 0).success;
      }
      isNullable() {
        return this.safeParse(null).success;
      }
    };
    cuidRegex = /^c[^\s-]{8,}$/i;
    cuid2Regex = /^[0-9a-z]+$/;
    ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
    uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
    nanoidRegex = /^[a-z0-9_-]{21}$/i;
    jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
    durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
    emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
    _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
    ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
    ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
    ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
    ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
    base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
    base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
    dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
    dateRegex = new RegExp(`^${dateRegexSource}$`);
    __name(timeRegexSource, "timeRegexSource");
    __name(timeRegex, "timeRegex");
    __name(datetimeRegex, "datetimeRegex");
    __name(isValidIP, "isValidIP");
    __name(isValidJWT, "isValidJWT");
    __name(isValidCidr, "isValidCidr");
    ZodString = class _ZodString extends ZodType {
      static {
        __name(this, "ZodString");
      }
      _parse(input) {
        if (this._def.coerce) {
          input.data = String(input.data);
        }
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.string) {
          const ctx2 = this._getOrReturnCtx(input);
          addIssueToContext(ctx2, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.string,
            received: ctx2.parsedType
          });
          return INVALID;
        }
        const status = new ParseStatus();
        let ctx = void 0;
        for (const check of this._def.checks) {
          if (check.kind === "min") {
            if (input.data.length < check.value) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.too_small,
                minimum: check.value,
                type: "string",
                inclusive: true,
                exact: false,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "max") {
            if (input.data.length > check.value) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.too_big,
                maximum: check.value,
                type: "string",
                inclusive: true,
                exact: false,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "length") {
            const tooBig = input.data.length > check.value;
            const tooSmall = input.data.length < check.value;
            if (tooBig || tooSmall) {
              ctx = this._getOrReturnCtx(input, ctx);
              if (tooBig) {
                addIssueToContext(ctx, {
                  code: ZodIssueCode.too_big,
                  maximum: check.value,
                  type: "string",
                  inclusive: true,
                  exact: true,
                  message: check.message
                });
              } else if (tooSmall) {
                addIssueToContext(ctx, {
                  code: ZodIssueCode.too_small,
                  minimum: check.value,
                  type: "string",
                  inclusive: true,
                  exact: true,
                  message: check.message
                });
              }
              status.dirty();
            }
          } else if (check.kind === "email") {
            if (!emailRegex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "email",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "emoji") {
            if (!emojiRegex) {
              emojiRegex = new RegExp(_emojiRegex, "u");
            }
            if (!emojiRegex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "emoji",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "uuid") {
            if (!uuidRegex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "uuid",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "nanoid") {
            if (!nanoidRegex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "nanoid",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "cuid") {
            if (!cuidRegex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "cuid",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "cuid2") {
            if (!cuid2Regex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "cuid2",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "ulid") {
            if (!ulidRegex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "ulid",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "url") {
            try {
              new URL(input.data);
            } catch {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "url",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "regex") {
            check.regex.lastIndex = 0;
            const testResult = check.regex.test(input.data);
            if (!testResult) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "regex",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "trim") {
            input.data = input.data.trim();
          } else if (check.kind === "includes") {
            if (!input.data.includes(check.value, check.position)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_string,
                validation: { includes: check.value, position: check.position },
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "toLowerCase") {
            input.data = input.data.toLowerCase();
          } else if (check.kind === "toUpperCase") {
            input.data = input.data.toUpperCase();
          } else if (check.kind === "startsWith") {
            if (!input.data.startsWith(check.value)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_string,
                validation: { startsWith: check.value },
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "endsWith") {
            if (!input.data.endsWith(check.value)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_string,
                validation: { endsWith: check.value },
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "datetime") {
            const regex = datetimeRegex(check);
            if (!regex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_string,
                validation: "datetime",
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "date") {
            const regex = dateRegex;
            if (!regex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_string,
                validation: "date",
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "time") {
            const regex = timeRegex(check);
            if (!regex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_string,
                validation: "time",
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "duration") {
            if (!durationRegex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "duration",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "ip") {
            if (!isValidIP(input.data, check.version)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "ip",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "jwt") {
            if (!isValidJWT(input.data, check.alg)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "jwt",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "cidr") {
            if (!isValidCidr(input.data, check.version)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "cidr",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "base64") {
            if (!base64Regex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "base64",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "base64url") {
            if (!base64urlRegex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "base64url",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else {
            util.assertNever(check);
          }
        }
        return { status: status.value, value: input.data };
      }
      _regex(regex, validation, message) {
        return this.refinement((data) => regex.test(data), {
          validation,
          code: ZodIssueCode.invalid_string,
          ...errorUtil.errToObj(message)
        });
      }
      _addCheck(check) {
        return new _ZodString({
          ...this._def,
          checks: [...this._def.checks, check]
        });
      }
      email(message) {
        return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
      }
      url(message) {
        return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
      }
      emoji(message) {
        return this._addCheck({ kind: "emoji", ...errorUtil.errToObj(message) });
      }
      uuid(message) {
        return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
      }
      nanoid(message) {
        return this._addCheck({ kind: "nanoid", ...errorUtil.errToObj(message) });
      }
      cuid(message) {
        return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
      }
      cuid2(message) {
        return this._addCheck({ kind: "cuid2", ...errorUtil.errToObj(message) });
      }
      ulid(message) {
        return this._addCheck({ kind: "ulid", ...errorUtil.errToObj(message) });
      }
      base64(message) {
        return this._addCheck({ kind: "base64", ...errorUtil.errToObj(message) });
      }
      base64url(message) {
        return this._addCheck({
          kind: "base64url",
          ...errorUtil.errToObj(message)
        });
      }
      jwt(options) {
        return this._addCheck({ kind: "jwt", ...errorUtil.errToObj(options) });
      }
      ip(options) {
        return this._addCheck({ kind: "ip", ...errorUtil.errToObj(options) });
      }
      cidr(options) {
        return this._addCheck({ kind: "cidr", ...errorUtil.errToObj(options) });
      }
      datetime(options) {
        if (typeof options === "string") {
          return this._addCheck({
            kind: "datetime",
            precision: null,
            offset: false,
            local: false,
            message: options
          });
        }
        return this._addCheck({
          kind: "datetime",
          precision: typeof options?.precision === "undefined" ? null : options?.precision,
          offset: options?.offset ?? false,
          local: options?.local ?? false,
          ...errorUtil.errToObj(options?.message)
        });
      }
      date(message) {
        return this._addCheck({ kind: "date", message });
      }
      time(options) {
        if (typeof options === "string") {
          return this._addCheck({
            kind: "time",
            precision: null,
            message: options
          });
        }
        return this._addCheck({
          kind: "time",
          precision: typeof options?.precision === "undefined" ? null : options?.precision,
          ...errorUtil.errToObj(options?.message)
        });
      }
      duration(message) {
        return this._addCheck({ kind: "duration", ...errorUtil.errToObj(message) });
      }
      regex(regex, message) {
        return this._addCheck({
          kind: "regex",
          regex,
          ...errorUtil.errToObj(message)
        });
      }
      includes(value, options) {
        return this._addCheck({
          kind: "includes",
          value,
          position: options?.position,
          ...errorUtil.errToObj(options?.message)
        });
      }
      startsWith(value, message) {
        return this._addCheck({
          kind: "startsWith",
          value,
          ...errorUtil.errToObj(message)
        });
      }
      endsWith(value, message) {
        return this._addCheck({
          kind: "endsWith",
          value,
          ...errorUtil.errToObj(message)
        });
      }
      min(minLength, message) {
        return this._addCheck({
          kind: "min",
          value: minLength,
          ...errorUtil.errToObj(message)
        });
      }
      max(maxLength, message) {
        return this._addCheck({
          kind: "max",
          value: maxLength,
          ...errorUtil.errToObj(message)
        });
      }
      length(len, message) {
        return this._addCheck({
          kind: "length",
          value: len,
          ...errorUtil.errToObj(message)
        });
      }
      /**
       * Equivalent to `.min(1)`
       */
      nonempty(message) {
        return this.min(1, errorUtil.errToObj(message));
      }
      trim() {
        return new _ZodString({
          ...this._def,
          checks: [...this._def.checks, { kind: "trim" }]
        });
      }
      toLowerCase() {
        return new _ZodString({
          ...this._def,
          checks: [...this._def.checks, { kind: "toLowerCase" }]
        });
      }
      toUpperCase() {
        return new _ZodString({
          ...this._def,
          checks: [...this._def.checks, { kind: "toUpperCase" }]
        });
      }
      get isDatetime() {
        return !!this._def.checks.find((ch) => ch.kind === "datetime");
      }
      get isDate() {
        return !!this._def.checks.find((ch) => ch.kind === "date");
      }
      get isTime() {
        return !!this._def.checks.find((ch) => ch.kind === "time");
      }
      get isDuration() {
        return !!this._def.checks.find((ch) => ch.kind === "duration");
      }
      get isEmail() {
        return !!this._def.checks.find((ch) => ch.kind === "email");
      }
      get isURL() {
        return !!this._def.checks.find((ch) => ch.kind === "url");
      }
      get isEmoji() {
        return !!this._def.checks.find((ch) => ch.kind === "emoji");
      }
      get isUUID() {
        return !!this._def.checks.find((ch) => ch.kind === "uuid");
      }
      get isNANOID() {
        return !!this._def.checks.find((ch) => ch.kind === "nanoid");
      }
      get isCUID() {
        return !!this._def.checks.find((ch) => ch.kind === "cuid");
      }
      get isCUID2() {
        return !!this._def.checks.find((ch) => ch.kind === "cuid2");
      }
      get isULID() {
        return !!this._def.checks.find((ch) => ch.kind === "ulid");
      }
      get isIP() {
        return !!this._def.checks.find((ch) => ch.kind === "ip");
      }
      get isCIDR() {
        return !!this._def.checks.find((ch) => ch.kind === "cidr");
      }
      get isBase64() {
        return !!this._def.checks.find((ch) => ch.kind === "base64");
      }
      get isBase64url() {
        return !!this._def.checks.find((ch) => ch.kind === "base64url");
      }
      get minLength() {
        let min = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "min") {
            if (min === null || ch.value > min)
              min = ch.value;
          }
        }
        return min;
      }
      get maxLength() {
        let max = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "max") {
            if (max === null || ch.value < max)
              max = ch.value;
          }
        }
        return max;
      }
    };
    ZodString.create = (params) => {
      return new ZodString({
        checks: [],
        typeName: ZodFirstPartyTypeKind.ZodString,
        coerce: params?.coerce ?? false,
        ...processCreateParams(params)
      });
    };
    __name(floatSafeRemainder, "floatSafeRemainder");
    ZodNumber = class _ZodNumber extends ZodType {
      static {
        __name(this, "ZodNumber");
      }
      constructor() {
        super(...arguments);
        this.min = this.gte;
        this.max = this.lte;
        this.step = this.multipleOf;
      }
      _parse(input) {
        if (this._def.coerce) {
          input.data = Number(input.data);
        }
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.number) {
          const ctx2 = this._getOrReturnCtx(input);
          addIssueToContext(ctx2, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.number,
            received: ctx2.parsedType
          });
          return INVALID;
        }
        let ctx = void 0;
        const status = new ParseStatus();
        for (const check of this._def.checks) {
          if (check.kind === "int") {
            if (!util.isInteger(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: "integer",
                received: "float",
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "min") {
            const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
            if (tooSmall) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.too_small,
                minimum: check.value,
                type: "number",
                inclusive: check.inclusive,
                exact: false,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "max") {
            const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
            if (tooBig) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.too_big,
                maximum: check.value,
                type: "number",
                inclusive: check.inclusive,
                exact: false,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "multipleOf") {
            if (floatSafeRemainder(input.data, check.value) !== 0) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.not_multiple_of,
                multipleOf: check.value,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "finite") {
            if (!Number.isFinite(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.not_finite,
                message: check.message
              });
              status.dirty();
            }
          } else {
            util.assertNever(check);
          }
        }
        return { status: status.value, value: input.data };
      }
      gte(value, message) {
        return this.setLimit("min", value, true, errorUtil.toString(message));
      }
      gt(value, message) {
        return this.setLimit("min", value, false, errorUtil.toString(message));
      }
      lte(value, message) {
        return this.setLimit("max", value, true, errorUtil.toString(message));
      }
      lt(value, message) {
        return this.setLimit("max", value, false, errorUtil.toString(message));
      }
      setLimit(kind, value, inclusive, message) {
        return new _ZodNumber({
          ...this._def,
          checks: [
            ...this._def.checks,
            {
              kind,
              value,
              inclusive,
              message: errorUtil.toString(message)
            }
          ]
        });
      }
      _addCheck(check) {
        return new _ZodNumber({
          ...this._def,
          checks: [...this._def.checks, check]
        });
      }
      int(message) {
        return this._addCheck({
          kind: "int",
          message: errorUtil.toString(message)
        });
      }
      positive(message) {
        return this._addCheck({
          kind: "min",
          value: 0,
          inclusive: false,
          message: errorUtil.toString(message)
        });
      }
      negative(message) {
        return this._addCheck({
          kind: "max",
          value: 0,
          inclusive: false,
          message: errorUtil.toString(message)
        });
      }
      nonpositive(message) {
        return this._addCheck({
          kind: "max",
          value: 0,
          inclusive: true,
          message: errorUtil.toString(message)
        });
      }
      nonnegative(message) {
        return this._addCheck({
          kind: "min",
          value: 0,
          inclusive: true,
          message: errorUtil.toString(message)
        });
      }
      multipleOf(value, message) {
        return this._addCheck({
          kind: "multipleOf",
          value,
          message: errorUtil.toString(message)
        });
      }
      finite(message) {
        return this._addCheck({
          kind: "finite",
          message: errorUtil.toString(message)
        });
      }
      safe(message) {
        return this._addCheck({
          kind: "min",
          inclusive: true,
          value: Number.MIN_SAFE_INTEGER,
          message: errorUtil.toString(message)
        })._addCheck({
          kind: "max",
          inclusive: true,
          value: Number.MAX_SAFE_INTEGER,
          message: errorUtil.toString(message)
        });
      }
      get minValue() {
        let min = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "min") {
            if (min === null || ch.value > min)
              min = ch.value;
          }
        }
        return min;
      }
      get maxValue() {
        let max = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "max") {
            if (max === null || ch.value < max)
              max = ch.value;
          }
        }
        return max;
      }
      get isInt() {
        return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util.isInteger(ch.value));
      }
      get isFinite() {
        let max = null;
        let min = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") {
            return true;
          } else if (ch.kind === "min") {
            if (min === null || ch.value > min)
              min = ch.value;
          } else if (ch.kind === "max") {
            if (max === null || ch.value < max)
              max = ch.value;
          }
        }
        return Number.isFinite(min) && Number.isFinite(max);
      }
    };
    ZodNumber.create = (params) => {
      return new ZodNumber({
        checks: [],
        typeName: ZodFirstPartyTypeKind.ZodNumber,
        coerce: params?.coerce || false,
        ...processCreateParams(params)
      });
    };
    ZodBigInt = class _ZodBigInt extends ZodType {
      static {
        __name(this, "ZodBigInt");
      }
      constructor() {
        super(...arguments);
        this.min = this.gte;
        this.max = this.lte;
      }
      _parse(input) {
        if (this._def.coerce) {
          try {
            input.data = BigInt(input.data);
          } catch {
            return this._getInvalidInput(input);
          }
        }
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.bigint) {
          return this._getInvalidInput(input);
        }
        let ctx = void 0;
        const status = new ParseStatus();
        for (const check of this._def.checks) {
          if (check.kind === "min") {
            const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
            if (tooSmall) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.too_small,
                type: "bigint",
                minimum: check.value,
                inclusive: check.inclusive,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "max") {
            const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
            if (tooBig) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.too_big,
                type: "bigint",
                maximum: check.value,
                inclusive: check.inclusive,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "multipleOf") {
            if (input.data % check.value !== BigInt(0)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.not_multiple_of,
                multipleOf: check.value,
                message: check.message
              });
              status.dirty();
            }
          } else {
            util.assertNever(check);
          }
        }
        return { status: status.value, value: input.data };
      }
      _getInvalidInput(input) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.bigint,
          received: ctx.parsedType
        });
        return INVALID;
      }
      gte(value, message) {
        return this.setLimit("min", value, true, errorUtil.toString(message));
      }
      gt(value, message) {
        return this.setLimit("min", value, false, errorUtil.toString(message));
      }
      lte(value, message) {
        return this.setLimit("max", value, true, errorUtil.toString(message));
      }
      lt(value, message) {
        return this.setLimit("max", value, false, errorUtil.toString(message));
      }
      setLimit(kind, value, inclusive, message) {
        return new _ZodBigInt({
          ...this._def,
          checks: [
            ...this._def.checks,
            {
              kind,
              value,
              inclusive,
              message: errorUtil.toString(message)
            }
          ]
        });
      }
      _addCheck(check) {
        return new _ZodBigInt({
          ...this._def,
          checks: [...this._def.checks, check]
        });
      }
      positive(message) {
        return this._addCheck({
          kind: "min",
          value: BigInt(0),
          inclusive: false,
          message: errorUtil.toString(message)
        });
      }
      negative(message) {
        return this._addCheck({
          kind: "max",
          value: BigInt(0),
          inclusive: false,
          message: errorUtil.toString(message)
        });
      }
      nonpositive(message) {
        return this._addCheck({
          kind: "max",
          value: BigInt(0),
          inclusive: true,
          message: errorUtil.toString(message)
        });
      }
      nonnegative(message) {
        return this._addCheck({
          kind: "min",
          value: BigInt(0),
          inclusive: true,
          message: errorUtil.toString(message)
        });
      }
      multipleOf(value, message) {
        return this._addCheck({
          kind: "multipleOf",
          value,
          message: errorUtil.toString(message)
        });
      }
      get minValue() {
        let min = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "min") {
            if (min === null || ch.value > min)
              min = ch.value;
          }
        }
        return min;
      }
      get maxValue() {
        let max = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "max") {
            if (max === null || ch.value < max)
              max = ch.value;
          }
        }
        return max;
      }
    };
    ZodBigInt.create = (params) => {
      return new ZodBigInt({
        checks: [],
        typeName: ZodFirstPartyTypeKind.ZodBigInt,
        coerce: params?.coerce ?? false,
        ...processCreateParams(params)
      });
    };
    ZodBoolean = class extends ZodType {
      static {
        __name(this, "ZodBoolean");
      }
      _parse(input) {
        if (this._def.coerce) {
          input.data = Boolean(input.data);
        }
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.boolean) {
          const ctx = this._getOrReturnCtx(input);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.boolean,
            received: ctx.parsedType
          });
          return INVALID;
        }
        return OK(input.data);
      }
    };
    ZodBoolean.create = (params) => {
      return new ZodBoolean({
        typeName: ZodFirstPartyTypeKind.ZodBoolean,
        coerce: params?.coerce || false,
        ...processCreateParams(params)
      });
    };
    ZodDate = class _ZodDate extends ZodType {
      static {
        __name(this, "ZodDate");
      }
      _parse(input) {
        if (this._def.coerce) {
          input.data = new Date(input.data);
        }
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.date) {
          const ctx2 = this._getOrReturnCtx(input);
          addIssueToContext(ctx2, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.date,
            received: ctx2.parsedType
          });
          return INVALID;
        }
        if (Number.isNaN(input.data.getTime())) {
          const ctx2 = this._getOrReturnCtx(input);
          addIssueToContext(ctx2, {
            code: ZodIssueCode.invalid_date
          });
          return INVALID;
        }
        const status = new ParseStatus();
        let ctx = void 0;
        for (const check of this._def.checks) {
          if (check.kind === "min") {
            if (input.data.getTime() < check.value) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.too_small,
                message: check.message,
                inclusive: true,
                exact: false,
                minimum: check.value,
                type: "date"
              });
              status.dirty();
            }
          } else if (check.kind === "max") {
            if (input.data.getTime() > check.value) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.too_big,
                message: check.message,
                inclusive: true,
                exact: false,
                maximum: check.value,
                type: "date"
              });
              status.dirty();
            }
          } else {
            util.assertNever(check);
          }
        }
        return {
          status: status.value,
          value: new Date(input.data.getTime())
        };
      }
      _addCheck(check) {
        return new _ZodDate({
          ...this._def,
          checks: [...this._def.checks, check]
        });
      }
      min(minDate, message) {
        return this._addCheck({
          kind: "min",
          value: minDate.getTime(),
          message: errorUtil.toString(message)
        });
      }
      max(maxDate, message) {
        return this._addCheck({
          kind: "max",
          value: maxDate.getTime(),
          message: errorUtil.toString(message)
        });
      }
      get minDate() {
        let min = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "min") {
            if (min === null || ch.value > min)
              min = ch.value;
          }
        }
        return min != null ? new Date(min) : null;
      }
      get maxDate() {
        let max = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "max") {
            if (max === null || ch.value < max)
              max = ch.value;
          }
        }
        return max != null ? new Date(max) : null;
      }
    };
    ZodDate.create = (params) => {
      return new ZodDate({
        checks: [],
        coerce: params?.coerce || false,
        typeName: ZodFirstPartyTypeKind.ZodDate,
        ...processCreateParams(params)
      });
    };
    ZodSymbol = class extends ZodType {
      static {
        __name(this, "ZodSymbol");
      }
      _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.symbol) {
          const ctx = this._getOrReturnCtx(input);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.symbol,
            received: ctx.parsedType
          });
          return INVALID;
        }
        return OK(input.data);
      }
    };
    ZodSymbol.create = (params) => {
      return new ZodSymbol({
        typeName: ZodFirstPartyTypeKind.ZodSymbol,
        ...processCreateParams(params)
      });
    };
    ZodUndefined = class extends ZodType {
      static {
        __name(this, "ZodUndefined");
      }
      _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.undefined) {
          const ctx = this._getOrReturnCtx(input);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.undefined,
            received: ctx.parsedType
          });
          return INVALID;
        }
        return OK(input.data);
      }
    };
    ZodUndefined.create = (params) => {
      return new ZodUndefined({
        typeName: ZodFirstPartyTypeKind.ZodUndefined,
        ...processCreateParams(params)
      });
    };
    ZodNull = class extends ZodType {
      static {
        __name(this, "ZodNull");
      }
      _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.null) {
          const ctx = this._getOrReturnCtx(input);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.null,
            received: ctx.parsedType
          });
          return INVALID;
        }
        return OK(input.data);
      }
    };
    ZodNull.create = (params) => {
      return new ZodNull({
        typeName: ZodFirstPartyTypeKind.ZodNull,
        ...processCreateParams(params)
      });
    };
    ZodAny = class extends ZodType {
      static {
        __name(this, "ZodAny");
      }
      constructor() {
        super(...arguments);
        this._any = true;
      }
      _parse(input) {
        return OK(input.data);
      }
    };
    ZodAny.create = (params) => {
      return new ZodAny({
        typeName: ZodFirstPartyTypeKind.ZodAny,
        ...processCreateParams(params)
      });
    };
    ZodUnknown = class extends ZodType {
      static {
        __name(this, "ZodUnknown");
      }
      constructor() {
        super(...arguments);
        this._unknown = true;
      }
      _parse(input) {
        return OK(input.data);
      }
    };
    ZodUnknown.create = (params) => {
      return new ZodUnknown({
        typeName: ZodFirstPartyTypeKind.ZodUnknown,
        ...processCreateParams(params)
      });
    };
    ZodNever = class extends ZodType {
      static {
        __name(this, "ZodNever");
      }
      _parse(input) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.never,
          received: ctx.parsedType
        });
        return INVALID;
      }
    };
    ZodNever.create = (params) => {
      return new ZodNever({
        typeName: ZodFirstPartyTypeKind.ZodNever,
        ...processCreateParams(params)
      });
    };
    ZodVoid = class extends ZodType {
      static {
        __name(this, "ZodVoid");
      }
      _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.undefined) {
          const ctx = this._getOrReturnCtx(input);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.void,
            received: ctx.parsedType
          });
          return INVALID;
        }
        return OK(input.data);
      }
    };
    ZodVoid.create = (params) => {
      return new ZodVoid({
        typeName: ZodFirstPartyTypeKind.ZodVoid,
        ...processCreateParams(params)
      });
    };
    ZodArray = class _ZodArray extends ZodType {
      static {
        __name(this, "ZodArray");
      }
      _parse(input) {
        const { ctx, status } = this._processInputParams(input);
        const def = this._def;
        if (ctx.parsedType !== ZodParsedType.array) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.array,
            received: ctx.parsedType
          });
          return INVALID;
        }
        if (def.exactLength !== null) {
          const tooBig = ctx.data.length > def.exactLength.value;
          const tooSmall = ctx.data.length < def.exactLength.value;
          if (tooBig || tooSmall) {
            addIssueToContext(ctx, {
              code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
              minimum: tooSmall ? def.exactLength.value : void 0,
              maximum: tooBig ? def.exactLength.value : void 0,
              type: "array",
              inclusive: true,
              exact: true,
              message: def.exactLength.message
            });
            status.dirty();
          }
        }
        if (def.minLength !== null) {
          if (ctx.data.length < def.minLength.value) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: def.minLength.value,
              type: "array",
              inclusive: true,
              exact: false,
              message: def.minLength.message
            });
            status.dirty();
          }
        }
        if (def.maxLength !== null) {
          if (ctx.data.length > def.maxLength.value) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: def.maxLength.value,
              type: "array",
              inclusive: true,
              exact: false,
              message: def.maxLength.message
            });
            status.dirty();
          }
        }
        if (ctx.common.async) {
          return Promise.all([...ctx.data].map((item, i) => {
            return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
          })).then((result2) => {
            return ParseStatus.mergeArray(status, result2);
          });
        }
        const result = [...ctx.data].map((item, i) => {
          return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
        });
        return ParseStatus.mergeArray(status, result);
      }
      get element() {
        return this._def.type;
      }
      min(minLength, message) {
        return new _ZodArray({
          ...this._def,
          minLength: { value: minLength, message: errorUtil.toString(message) }
        });
      }
      max(maxLength, message) {
        return new _ZodArray({
          ...this._def,
          maxLength: { value: maxLength, message: errorUtil.toString(message) }
        });
      }
      length(len, message) {
        return new _ZodArray({
          ...this._def,
          exactLength: { value: len, message: errorUtil.toString(message) }
        });
      }
      nonempty(message) {
        return this.min(1, message);
      }
    };
    ZodArray.create = (schema, params) => {
      return new ZodArray({
        type: schema,
        minLength: null,
        maxLength: null,
        exactLength: null,
        typeName: ZodFirstPartyTypeKind.ZodArray,
        ...processCreateParams(params)
      });
    };
    __name(deepPartialify, "deepPartialify");
    ZodObject = class _ZodObject extends ZodType {
      static {
        __name(this, "ZodObject");
      }
      constructor() {
        super(...arguments);
        this._cached = null;
        this.nonstrict = this.passthrough;
        this.augment = this.extend;
      }
      _getCached() {
        if (this._cached !== null)
          return this._cached;
        const shape = this._def.shape();
        const keys = util.objectKeys(shape);
        this._cached = { shape, keys };
        return this._cached;
      }
      _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.object) {
          const ctx2 = this._getOrReturnCtx(input);
          addIssueToContext(ctx2, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.object,
            received: ctx2.parsedType
          });
          return INVALID;
        }
        const { status, ctx } = this._processInputParams(input);
        const { shape, keys: shapeKeys } = this._getCached();
        const extraKeys = [];
        if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
          for (const key in ctx.data) {
            if (!shapeKeys.includes(key)) {
              extraKeys.push(key);
            }
          }
        }
        const pairs = [];
        for (const key of shapeKeys) {
          const keyValidator = shape[key];
          const value = ctx.data[key];
          pairs.push({
            key: { status: "valid", value: key },
            value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
            alwaysSet: key in ctx.data
          });
        }
        if (this._def.catchall instanceof ZodNever) {
          const unknownKeys = this._def.unknownKeys;
          if (unknownKeys === "passthrough") {
            for (const key of extraKeys) {
              pairs.push({
                key: { status: "valid", value: key },
                value: { status: "valid", value: ctx.data[key] }
              });
            }
          } else if (unknownKeys === "strict") {
            if (extraKeys.length > 0) {
              addIssueToContext(ctx, {
                code: ZodIssueCode.unrecognized_keys,
                keys: extraKeys
              });
              status.dirty();
            }
          } else if (unknownKeys === "strip") ;
          else {
            throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
          }
        } else {
          const catchall = this._def.catchall;
          for (const key of extraKeys) {
            const value = ctx.data[key];
            pairs.push({
              key: { status: "valid", value: key },
              value: catchall._parse(
                new ParseInputLazyPath(ctx, value, ctx.path, key)
                //, ctx.child(key), value, getParsedType(value)
              ),
              alwaysSet: key in ctx.data
            });
          }
        }
        if (ctx.common.async) {
          return Promise.resolve().then(async () => {
            const syncPairs = [];
            for (const pair of pairs) {
              const key = await pair.key;
              const value = await pair.value;
              syncPairs.push({
                key,
                value,
                alwaysSet: pair.alwaysSet
              });
            }
            return syncPairs;
          }).then((syncPairs) => {
            return ParseStatus.mergeObjectSync(status, syncPairs);
          });
        } else {
          return ParseStatus.mergeObjectSync(status, pairs);
        }
      }
      get shape() {
        return this._def.shape();
      }
      strict(message) {
        errorUtil.errToObj;
        return new _ZodObject({
          ...this._def,
          unknownKeys: "strict",
          ...message !== void 0 ? {
            errorMap: /* @__PURE__ */ __name((issue, ctx) => {
              const defaultError = this._def.errorMap?.(issue, ctx).message ?? ctx.defaultError;
              if (issue.code === "unrecognized_keys")
                return {
                  message: errorUtil.errToObj(message).message ?? defaultError
                };
              return {
                message: defaultError
              };
            }, "errorMap")
          } : {}
        });
      }
      strip() {
        return new _ZodObject({
          ...this._def,
          unknownKeys: "strip"
        });
      }
      passthrough() {
        return new _ZodObject({
          ...this._def,
          unknownKeys: "passthrough"
        });
      }
      // const AugmentFactory =
      //   <Def extends ZodObjectDef>(def: Def) =>
      //   <Augmentation extends ZodRawShape>(
      //     augmentation: Augmentation
      //   ): ZodObject<
      //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
      //     Def["unknownKeys"],
      //     Def["catchall"]
      //   > => {
      //     return new ZodObject({
      //       ...def,
      //       shape: () => ({
      //         ...def.shape(),
      //         ...augmentation,
      //       }),
      //     }) as any;
      //   };
      extend(augmentation) {
        return new _ZodObject({
          ...this._def,
          shape: /* @__PURE__ */ __name(() => ({
            ...this._def.shape(),
            ...augmentation
          }), "shape")
        });
      }
      /**
       * Prior to zod@1.0.12 there was a bug in the
       * inferred type of merged objects. Please
       * upgrade if you are experiencing issues.
       */
      merge(merging) {
        const merged = new _ZodObject({
          unknownKeys: merging._def.unknownKeys,
          catchall: merging._def.catchall,
          shape: /* @__PURE__ */ __name(() => ({
            ...this._def.shape(),
            ...merging._def.shape()
          }), "shape"),
          typeName: ZodFirstPartyTypeKind.ZodObject
        });
        return merged;
      }
      // merge<
      //   Incoming extends AnyZodObject,
      //   Augmentation extends Incoming["shape"],
      //   NewOutput extends {
      //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
      //       ? Augmentation[k]["_output"]
      //       : k extends keyof Output
      //       ? Output[k]
      //       : never;
      //   },
      //   NewInput extends {
      //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
      //       ? Augmentation[k]["_input"]
      //       : k extends keyof Input
      //       ? Input[k]
      //       : never;
      //   }
      // >(
      //   merging: Incoming
      // ): ZodObject<
      //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
      //   Incoming["_def"]["unknownKeys"],
      //   Incoming["_def"]["catchall"],
      //   NewOutput,
      //   NewInput
      // > {
      //   const merged: any = new ZodObject({
      //     unknownKeys: merging._def.unknownKeys,
      //     catchall: merging._def.catchall,
      //     shape: () =>
      //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
      //     typeName: ZodFirstPartyTypeKind.ZodObject,
      //   }) as any;
      //   return merged;
      // }
      setKey(key, schema) {
        return this.augment({ [key]: schema });
      }
      // merge<Incoming extends AnyZodObject>(
      //   merging: Incoming
      // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
      // ZodObject<
      //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
      //   Incoming["_def"]["unknownKeys"],
      //   Incoming["_def"]["catchall"]
      // > {
      //   // const mergedShape = objectUtil.mergeShapes(
      //   //   this._def.shape(),
      //   //   merging._def.shape()
      //   // );
      //   const merged: any = new ZodObject({
      //     unknownKeys: merging._def.unknownKeys,
      //     catchall: merging._def.catchall,
      //     shape: () =>
      //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
      //     typeName: ZodFirstPartyTypeKind.ZodObject,
      //   }) as any;
      //   return merged;
      // }
      catchall(index) {
        return new _ZodObject({
          ...this._def,
          catchall: index
        });
      }
      pick(mask) {
        const shape = {};
        for (const key of util.objectKeys(mask)) {
          if (mask[key] && this.shape[key]) {
            shape[key] = this.shape[key];
          }
        }
        return new _ZodObject({
          ...this._def,
          shape: /* @__PURE__ */ __name(() => shape, "shape")
        });
      }
      omit(mask) {
        const shape = {};
        for (const key of util.objectKeys(this.shape)) {
          if (!mask[key]) {
            shape[key] = this.shape[key];
          }
        }
        return new _ZodObject({
          ...this._def,
          shape: /* @__PURE__ */ __name(() => shape, "shape")
        });
      }
      /**
       * @deprecated
       */
      deepPartial() {
        return deepPartialify(this);
      }
      partial(mask) {
        const newShape = {};
        for (const key of util.objectKeys(this.shape)) {
          const fieldSchema = this.shape[key];
          if (mask && !mask[key]) {
            newShape[key] = fieldSchema;
          } else {
            newShape[key] = fieldSchema.optional();
          }
        }
        return new _ZodObject({
          ...this._def,
          shape: /* @__PURE__ */ __name(() => newShape, "shape")
        });
      }
      required(mask) {
        const newShape = {};
        for (const key of util.objectKeys(this.shape)) {
          if (mask && !mask[key]) {
            newShape[key] = this.shape[key];
          } else {
            const fieldSchema = this.shape[key];
            let newField = fieldSchema;
            while (newField instanceof ZodOptional) {
              newField = newField._def.innerType;
            }
            newShape[key] = newField;
          }
        }
        return new _ZodObject({
          ...this._def,
          shape: /* @__PURE__ */ __name(() => newShape, "shape")
        });
      }
      keyof() {
        return createZodEnum(util.objectKeys(this.shape));
      }
    };
    ZodObject.create = (shape, params) => {
      return new ZodObject({
        shape: /* @__PURE__ */ __name(() => shape, "shape"),
        unknownKeys: "strip",
        catchall: ZodNever.create(),
        typeName: ZodFirstPartyTypeKind.ZodObject,
        ...processCreateParams(params)
      });
    };
    ZodObject.strictCreate = (shape, params) => {
      return new ZodObject({
        shape: /* @__PURE__ */ __name(() => shape, "shape"),
        unknownKeys: "strict",
        catchall: ZodNever.create(),
        typeName: ZodFirstPartyTypeKind.ZodObject,
        ...processCreateParams(params)
      });
    };
    ZodObject.lazycreate = (shape, params) => {
      return new ZodObject({
        shape,
        unknownKeys: "strip",
        catchall: ZodNever.create(),
        typeName: ZodFirstPartyTypeKind.ZodObject,
        ...processCreateParams(params)
      });
    };
    ZodUnion = class extends ZodType {
      static {
        __name(this, "ZodUnion");
      }
      _parse(input) {
        const { ctx } = this._processInputParams(input);
        const options = this._def.options;
        function handleResults(results) {
          for (const result of results) {
            if (result.result.status === "valid") {
              return result.result;
            }
          }
          for (const result of results) {
            if (result.result.status === "dirty") {
              ctx.common.issues.push(...result.ctx.common.issues);
              return result.result;
            }
          }
          const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_union,
            unionErrors
          });
          return INVALID;
        }
        __name(handleResults, "handleResults");
        if (ctx.common.async) {
          return Promise.all(options.map(async (option) => {
            const childCtx = {
              ...ctx,
              common: {
                ...ctx.common,
                issues: []
              },
              parent: null
            };
            return {
              result: await option._parseAsync({
                data: ctx.data,
                path: ctx.path,
                parent: childCtx
              }),
              ctx: childCtx
            };
          })).then(handleResults);
        } else {
          let dirty = void 0;
          const issues = [];
          for (const option of options) {
            const childCtx = {
              ...ctx,
              common: {
                ...ctx.common,
                issues: []
              },
              parent: null
            };
            const result = option._parseSync({
              data: ctx.data,
              path: ctx.path,
              parent: childCtx
            });
            if (result.status === "valid") {
              return result;
            } else if (result.status === "dirty" && !dirty) {
              dirty = { result, ctx: childCtx };
            }
            if (childCtx.common.issues.length) {
              issues.push(childCtx.common.issues);
            }
          }
          if (dirty) {
            ctx.common.issues.push(...dirty.ctx.common.issues);
            return dirty.result;
          }
          const unionErrors = issues.map((issues2) => new ZodError(issues2));
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_union,
            unionErrors
          });
          return INVALID;
        }
      }
      get options() {
        return this._def.options;
      }
    };
    ZodUnion.create = (types, params) => {
      return new ZodUnion({
        options: types,
        typeName: ZodFirstPartyTypeKind.ZodUnion,
        ...processCreateParams(params)
      });
    };
    __name(mergeValues, "mergeValues");
    ZodIntersection = class extends ZodType {
      static {
        __name(this, "ZodIntersection");
      }
      _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        const handleParsed = /* @__PURE__ */ __name((parsedLeft, parsedRight) => {
          if (isAborted(parsedLeft) || isAborted(parsedRight)) {
            return INVALID;
          }
          const merged = mergeValues(parsedLeft.value, parsedRight.value);
          if (!merged.valid) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.invalid_intersection_types
            });
            return INVALID;
          }
          if (isDirty(parsedLeft) || isDirty(parsedRight)) {
            status.dirty();
          }
          return { status: status.value, value: merged.data };
        }, "handleParsed");
        if (ctx.common.async) {
          return Promise.all([
            this._def.left._parseAsync({
              data: ctx.data,
              path: ctx.path,
              parent: ctx
            }),
            this._def.right._parseAsync({
              data: ctx.data,
              path: ctx.path,
              parent: ctx
            })
          ]).then(([left, right]) => handleParsed(left, right));
        } else {
          return handleParsed(this._def.left._parseSync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          }), this._def.right._parseSync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          }));
        }
      }
    };
    ZodIntersection.create = (left, right, params) => {
      return new ZodIntersection({
        left,
        right,
        typeName: ZodFirstPartyTypeKind.ZodIntersection,
        ...processCreateParams(params)
      });
    };
    ZodTuple = class _ZodTuple extends ZodType {
      static {
        __name(this, "ZodTuple");
      }
      _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.array) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.array,
            received: ctx.parsedType
          });
          return INVALID;
        }
        if (ctx.data.length < this._def.items.length) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: this._def.items.length,
            inclusive: true,
            exact: false,
            type: "array"
          });
          return INVALID;
        }
        const rest = this._def.rest;
        if (!rest && ctx.data.length > this._def.items.length) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: this._def.items.length,
            inclusive: true,
            exact: false,
            type: "array"
          });
          status.dirty();
        }
        const items = [...ctx.data].map((item, itemIndex) => {
          const schema = this._def.items[itemIndex] || this._def.rest;
          if (!schema)
            return null;
          return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
        }).filter((x) => !!x);
        if (ctx.common.async) {
          return Promise.all(items).then((results) => {
            return ParseStatus.mergeArray(status, results);
          });
        } else {
          return ParseStatus.mergeArray(status, items);
        }
      }
      get items() {
        return this._def.items;
      }
      rest(rest) {
        return new _ZodTuple({
          ...this._def,
          rest
        });
      }
    };
    ZodTuple.create = (schemas, params) => {
      if (!Array.isArray(schemas)) {
        throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
      }
      return new ZodTuple({
        items: schemas,
        typeName: ZodFirstPartyTypeKind.ZodTuple,
        rest: null,
        ...processCreateParams(params)
      });
    };
    ZodMap = class extends ZodType {
      static {
        __name(this, "ZodMap");
      }
      get keySchema() {
        return this._def.keyType;
      }
      get valueSchema() {
        return this._def.valueType;
      }
      _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.map) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.map,
            received: ctx.parsedType
          });
          return INVALID;
        }
        const keyType = this._def.keyType;
        const valueType = this._def.valueType;
        const pairs = [...ctx.data.entries()].map(([key, value], index) => {
          return {
            key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
            value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
          };
        });
        if (ctx.common.async) {
          const finalMap = /* @__PURE__ */ new Map();
          return Promise.resolve().then(async () => {
            for (const pair of pairs) {
              const key = await pair.key;
              const value = await pair.value;
              if (key.status === "aborted" || value.status === "aborted") {
                return INVALID;
              }
              if (key.status === "dirty" || value.status === "dirty") {
                status.dirty();
              }
              finalMap.set(key.value, value.value);
            }
            return { status: status.value, value: finalMap };
          });
        } else {
          const finalMap = /* @__PURE__ */ new Map();
          for (const pair of pairs) {
            const key = pair.key;
            const value = pair.value;
            if (key.status === "aborted" || value.status === "aborted") {
              return INVALID;
            }
            if (key.status === "dirty" || value.status === "dirty") {
              status.dirty();
            }
            finalMap.set(key.value, value.value);
          }
          return { status: status.value, value: finalMap };
        }
      }
    };
    ZodMap.create = (keyType, valueType, params) => {
      return new ZodMap({
        valueType,
        keyType,
        typeName: ZodFirstPartyTypeKind.ZodMap,
        ...processCreateParams(params)
      });
    };
    ZodSet = class _ZodSet extends ZodType {
      static {
        __name(this, "ZodSet");
      }
      _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.set) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.set,
            received: ctx.parsedType
          });
          return INVALID;
        }
        const def = this._def;
        if (def.minSize !== null) {
          if (ctx.data.size < def.minSize.value) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: def.minSize.value,
              type: "set",
              inclusive: true,
              exact: false,
              message: def.minSize.message
            });
            status.dirty();
          }
        }
        if (def.maxSize !== null) {
          if (ctx.data.size > def.maxSize.value) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: def.maxSize.value,
              type: "set",
              inclusive: true,
              exact: false,
              message: def.maxSize.message
            });
            status.dirty();
          }
        }
        const valueType = this._def.valueType;
        function finalizeSet(elements2) {
          const parsedSet = /* @__PURE__ */ new Set();
          for (const element of elements2) {
            if (element.status === "aborted")
              return INVALID;
            if (element.status === "dirty")
              status.dirty();
            parsedSet.add(element.value);
          }
          return { status: status.value, value: parsedSet };
        }
        __name(finalizeSet, "finalizeSet");
        const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
        if (ctx.common.async) {
          return Promise.all(elements).then((elements2) => finalizeSet(elements2));
        } else {
          return finalizeSet(elements);
        }
      }
      min(minSize, message) {
        return new _ZodSet({
          ...this._def,
          minSize: { value: minSize, message: errorUtil.toString(message) }
        });
      }
      max(maxSize, message) {
        return new _ZodSet({
          ...this._def,
          maxSize: { value: maxSize, message: errorUtil.toString(message) }
        });
      }
      size(size, message) {
        return this.min(size, message).max(size, message);
      }
      nonempty(message) {
        return this.min(1, message);
      }
    };
    ZodSet.create = (valueType, params) => {
      return new ZodSet({
        valueType,
        minSize: null,
        maxSize: null,
        typeName: ZodFirstPartyTypeKind.ZodSet,
        ...processCreateParams(params)
      });
    };
    ZodLazy = class extends ZodType {
      static {
        __name(this, "ZodLazy");
      }
      get schema() {
        return this._def.getter();
      }
      _parse(input) {
        const { ctx } = this._processInputParams(input);
        const lazySchema = this._def.getter();
        return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
      }
    };
    ZodLazy.create = (getter, params) => {
      return new ZodLazy({
        getter,
        typeName: ZodFirstPartyTypeKind.ZodLazy,
        ...processCreateParams(params)
      });
    };
    ZodLiteral = class extends ZodType {
      static {
        __name(this, "ZodLiteral");
      }
      _parse(input) {
        if (input.data !== this._def.value) {
          const ctx = this._getOrReturnCtx(input);
          addIssueToContext(ctx, {
            received: ctx.data,
            code: ZodIssueCode.invalid_literal,
            expected: this._def.value
          });
          return INVALID;
        }
        return { status: "valid", value: input.data };
      }
      get value() {
        return this._def.value;
      }
    };
    ZodLiteral.create = (value, params) => {
      return new ZodLiteral({
        value,
        typeName: ZodFirstPartyTypeKind.ZodLiteral,
        ...processCreateParams(params)
      });
    };
    __name(createZodEnum, "createZodEnum");
    ZodEnum = class _ZodEnum extends ZodType {
      static {
        __name(this, "ZodEnum");
      }
      _parse(input) {
        if (typeof input.data !== "string") {
          const ctx = this._getOrReturnCtx(input);
          const expectedValues = this._def.values;
          addIssueToContext(ctx, {
            expected: util.joinValues(expectedValues),
            received: ctx.parsedType,
            code: ZodIssueCode.invalid_type
          });
          return INVALID;
        }
        if (!this._cache) {
          this._cache = new Set(this._def.values);
        }
        if (!this._cache.has(input.data)) {
          const ctx = this._getOrReturnCtx(input);
          const expectedValues = this._def.values;
          addIssueToContext(ctx, {
            received: ctx.data,
            code: ZodIssueCode.invalid_enum_value,
            options: expectedValues
          });
          return INVALID;
        }
        return OK(input.data);
      }
      get options() {
        return this._def.values;
      }
      get enum() {
        const enumValues = {};
        for (const val of this._def.values) {
          enumValues[val] = val;
        }
        return enumValues;
      }
      get Values() {
        const enumValues = {};
        for (const val of this._def.values) {
          enumValues[val] = val;
        }
        return enumValues;
      }
      get Enum() {
        const enumValues = {};
        for (const val of this._def.values) {
          enumValues[val] = val;
        }
        return enumValues;
      }
      extract(values, newDef = this._def) {
        return _ZodEnum.create(values, {
          ...this._def,
          ...newDef
        });
      }
      exclude(values, newDef = this._def) {
        return _ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
          ...this._def,
          ...newDef
        });
      }
    };
    ZodEnum.create = createZodEnum;
    ZodNativeEnum = class extends ZodType {
      static {
        __name(this, "ZodNativeEnum");
      }
      _parse(input) {
        const nativeEnumValues = util.getValidEnumValues(this._def.values);
        const ctx = this._getOrReturnCtx(input);
        if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
          const expectedValues = util.objectValues(nativeEnumValues);
          addIssueToContext(ctx, {
            expected: util.joinValues(expectedValues),
            received: ctx.parsedType,
            code: ZodIssueCode.invalid_type
          });
          return INVALID;
        }
        if (!this._cache) {
          this._cache = new Set(util.getValidEnumValues(this._def.values));
        }
        if (!this._cache.has(input.data)) {
          const expectedValues = util.objectValues(nativeEnumValues);
          addIssueToContext(ctx, {
            received: ctx.data,
            code: ZodIssueCode.invalid_enum_value,
            options: expectedValues
          });
          return INVALID;
        }
        return OK(input.data);
      }
      get enum() {
        return this._def.values;
      }
    };
    ZodNativeEnum.create = (values, params) => {
      return new ZodNativeEnum({
        values,
        typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
        ...processCreateParams(params)
      });
    };
    ZodPromise = class extends ZodType {
      static {
        __name(this, "ZodPromise");
      }
      unwrap() {
        return this._def.type;
      }
      _parse(input) {
        const { ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.promise,
            received: ctx.parsedType
          });
          return INVALID;
        }
        const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
        return OK(promisified.then((data) => {
          return this._def.type.parseAsync(data, {
            path: ctx.path,
            errorMap: ctx.common.contextualErrorMap
          });
        }));
      }
    };
    ZodPromise.create = (schema, params) => {
      return new ZodPromise({
        type: schema,
        typeName: ZodFirstPartyTypeKind.ZodPromise,
        ...processCreateParams(params)
      });
    };
    ZodEffects = class extends ZodType {
      static {
        __name(this, "ZodEffects");
      }
      innerType() {
        return this._def.schema;
      }
      sourceType() {
        return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
      }
      _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        const effect = this._def.effect || null;
        const checkCtx = {
          addIssue: /* @__PURE__ */ __name((arg) => {
            addIssueToContext(ctx, arg);
            if (arg.fatal) {
              status.abort();
            } else {
              status.dirty();
            }
          }, "addIssue"),
          get path() {
            return ctx.path;
          }
        };
        checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
        if (effect.type === "preprocess") {
          const processed = effect.transform(ctx.data, checkCtx);
          if (ctx.common.async) {
            return Promise.resolve(processed).then(async (processed2) => {
              if (status.value === "aborted")
                return INVALID;
              const result = await this._def.schema._parseAsync({
                data: processed2,
                path: ctx.path,
                parent: ctx
              });
              if (result.status === "aborted")
                return INVALID;
              if (result.status === "dirty")
                return DIRTY(result.value);
              if (status.value === "dirty")
                return DIRTY(result.value);
              return result;
            });
          } else {
            if (status.value === "aborted")
              return INVALID;
            const result = this._def.schema._parseSync({
              data: processed,
              path: ctx.path,
              parent: ctx
            });
            if (result.status === "aborted")
              return INVALID;
            if (result.status === "dirty")
              return DIRTY(result.value);
            if (status.value === "dirty")
              return DIRTY(result.value);
            return result;
          }
        }
        if (effect.type === "refinement") {
          const executeRefinement = /* @__PURE__ */ __name((acc) => {
            const result = effect.refinement(acc, checkCtx);
            if (ctx.common.async) {
              return Promise.resolve(result);
            }
            if (result instanceof Promise) {
              throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
            }
            return acc;
          }, "executeRefinement");
          if (ctx.common.async === false) {
            const inner = this._def.schema._parseSync({
              data: ctx.data,
              path: ctx.path,
              parent: ctx
            });
            if (inner.status === "aborted")
              return INVALID;
            if (inner.status === "dirty")
              status.dirty();
            executeRefinement(inner.value);
            return { status: status.value, value: inner.value };
          } else {
            return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => {
              if (inner.status === "aborted")
                return INVALID;
              if (inner.status === "dirty")
                status.dirty();
              return executeRefinement(inner.value).then(() => {
                return { status: status.value, value: inner.value };
              });
            });
          }
        }
        if (effect.type === "transform") {
          if (ctx.common.async === false) {
            const base = this._def.schema._parseSync({
              data: ctx.data,
              path: ctx.path,
              parent: ctx
            });
            if (!isValid(base))
              return INVALID;
            const result = effect.transform(base.value, checkCtx);
            if (result instanceof Promise) {
              throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
            }
            return { status: status.value, value: result };
          } else {
            return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
              if (!isValid(base))
                return INVALID;
              return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
                status: status.value,
                value: result
              }));
            });
          }
        }
        util.assertNever(effect);
      }
    };
    ZodEffects.create = (schema, effect, params) => {
      return new ZodEffects({
        schema,
        typeName: ZodFirstPartyTypeKind.ZodEffects,
        effect,
        ...processCreateParams(params)
      });
    };
    ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
      return new ZodEffects({
        schema,
        effect: { type: "preprocess", transform: preprocess },
        typeName: ZodFirstPartyTypeKind.ZodEffects,
        ...processCreateParams(params)
      });
    };
    ZodOptional = class extends ZodType {
      static {
        __name(this, "ZodOptional");
      }
      _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType === ZodParsedType.undefined) {
          return OK(void 0);
        }
        return this._def.innerType._parse(input);
      }
      unwrap() {
        return this._def.innerType;
      }
    };
    ZodOptional.create = (type, params) => {
      return new ZodOptional({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodOptional,
        ...processCreateParams(params)
      });
    };
    ZodNullable = class extends ZodType {
      static {
        __name(this, "ZodNullable");
      }
      _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType === ZodParsedType.null) {
          return OK(null);
        }
        return this._def.innerType._parse(input);
      }
      unwrap() {
        return this._def.innerType;
      }
    };
    ZodNullable.create = (type, params) => {
      return new ZodNullable({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodNullable,
        ...processCreateParams(params)
      });
    };
    ZodDefault = class extends ZodType {
      static {
        __name(this, "ZodDefault");
      }
      _parse(input) {
        const { ctx } = this._processInputParams(input);
        let data = ctx.data;
        if (ctx.parsedType === ZodParsedType.undefined) {
          data = this._def.defaultValue();
        }
        return this._def.innerType._parse({
          data,
          path: ctx.path,
          parent: ctx
        });
      }
      removeDefault() {
        return this._def.innerType;
      }
    };
    ZodDefault.create = (type, params) => {
      return new ZodDefault({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodDefault,
        defaultValue: typeof params.default === "function" ? params.default : () => params.default,
        ...processCreateParams(params)
      });
    };
    ZodCatch = class extends ZodType {
      static {
        __name(this, "ZodCatch");
      }
      _parse(input) {
        const { ctx } = this._processInputParams(input);
        const newCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          }
        };
        const result = this._def.innerType._parse({
          data: newCtx.data,
          path: newCtx.path,
          parent: {
            ...newCtx
          }
        });
        if (isAsync(result)) {
          return result.then((result2) => {
            return {
              status: "valid",
              value: result2.status === "valid" ? result2.value : this._def.catchValue({
                get error() {
                  return new ZodError(newCtx.common.issues);
                },
                input: newCtx.data
              })
            };
          });
        } else {
          return {
            status: "valid",
            value: result.status === "valid" ? result.value : this._def.catchValue({
              get error() {
                return new ZodError(newCtx.common.issues);
              },
              input: newCtx.data
            })
          };
        }
      }
      removeCatch() {
        return this._def.innerType;
      }
    };
    ZodCatch.create = (type, params) => {
      return new ZodCatch({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodCatch,
        catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
        ...processCreateParams(params)
      });
    };
    ZodNaN = class extends ZodType {
      static {
        __name(this, "ZodNaN");
      }
      _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.nan) {
          const ctx = this._getOrReturnCtx(input);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.nan,
            received: ctx.parsedType
          });
          return INVALID;
        }
        return { status: "valid", value: input.data };
      }
    };
    ZodNaN.create = (params) => {
      return new ZodNaN({
        typeName: ZodFirstPartyTypeKind.ZodNaN,
        ...processCreateParams(params)
      });
    };
    ZodBranded = class extends ZodType {
      static {
        __name(this, "ZodBranded");
      }
      _parse(input) {
        const { ctx } = this._processInputParams(input);
        const data = ctx.data;
        return this._def.type._parse({
          data,
          path: ctx.path,
          parent: ctx
        });
      }
      unwrap() {
        return this._def.type;
      }
    };
    ZodPipeline = class _ZodPipeline extends ZodType {
      static {
        __name(this, "ZodPipeline");
      }
      _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.common.async) {
          const handleAsync = /* @__PURE__ */ __name(async () => {
            const inResult = await this._def.in._parseAsync({
              data: ctx.data,
              path: ctx.path,
              parent: ctx
            });
            if (inResult.status === "aborted")
              return INVALID;
            if (inResult.status === "dirty") {
              status.dirty();
              return DIRTY(inResult.value);
            } else {
              return this._def.out._parseAsync({
                data: inResult.value,
                path: ctx.path,
                parent: ctx
              });
            }
          }, "handleAsync");
          return handleAsync();
        } else {
          const inResult = this._def.in._parseSync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          });
          if (inResult.status === "aborted")
            return INVALID;
          if (inResult.status === "dirty") {
            status.dirty();
            return {
              status: "dirty",
              value: inResult.value
            };
          } else {
            return this._def.out._parseSync({
              data: inResult.value,
              path: ctx.path,
              parent: ctx
            });
          }
        }
      }
      static create(a, b) {
        return new _ZodPipeline({
          in: a,
          out: b,
          typeName: ZodFirstPartyTypeKind.ZodPipeline
        });
      }
    };
    ZodReadonly = class extends ZodType {
      static {
        __name(this, "ZodReadonly");
      }
      _parse(input) {
        const result = this._def.innerType._parse(input);
        const freeze = /* @__PURE__ */ __name((data) => {
          if (isValid(data)) {
            data.value = Object.freeze(data.value);
          }
          return data;
        }, "freeze");
        return isAsync(result) ? result.then((data) => freeze(data)) : freeze(result);
      }
      unwrap() {
        return this._def.innerType;
      }
    };
    ZodReadonly.create = (type, params) => {
      return new ZodReadonly({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodReadonly,
        ...processCreateParams(params)
      });
    };
    __name(cleanParams, "cleanParams");
    __name(custom, "custom");
    (function(ZodFirstPartyTypeKind2) {
      ZodFirstPartyTypeKind2["ZodString"] = "ZodString";
      ZodFirstPartyTypeKind2["ZodNumber"] = "ZodNumber";
      ZodFirstPartyTypeKind2["ZodNaN"] = "ZodNaN";
      ZodFirstPartyTypeKind2["ZodBigInt"] = "ZodBigInt";
      ZodFirstPartyTypeKind2["ZodBoolean"] = "ZodBoolean";
      ZodFirstPartyTypeKind2["ZodDate"] = "ZodDate";
      ZodFirstPartyTypeKind2["ZodSymbol"] = "ZodSymbol";
      ZodFirstPartyTypeKind2["ZodUndefined"] = "ZodUndefined";
      ZodFirstPartyTypeKind2["ZodNull"] = "ZodNull";
      ZodFirstPartyTypeKind2["ZodAny"] = "ZodAny";
      ZodFirstPartyTypeKind2["ZodUnknown"] = "ZodUnknown";
      ZodFirstPartyTypeKind2["ZodNever"] = "ZodNever";
      ZodFirstPartyTypeKind2["ZodVoid"] = "ZodVoid";
      ZodFirstPartyTypeKind2["ZodArray"] = "ZodArray";
      ZodFirstPartyTypeKind2["ZodObject"] = "ZodObject";
      ZodFirstPartyTypeKind2["ZodUnion"] = "ZodUnion";
      ZodFirstPartyTypeKind2["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
      ZodFirstPartyTypeKind2["ZodIntersection"] = "ZodIntersection";
      ZodFirstPartyTypeKind2["ZodTuple"] = "ZodTuple";
      ZodFirstPartyTypeKind2["ZodRecord"] = "ZodRecord";
      ZodFirstPartyTypeKind2["ZodMap"] = "ZodMap";
      ZodFirstPartyTypeKind2["ZodSet"] = "ZodSet";
      ZodFirstPartyTypeKind2["ZodFunction"] = "ZodFunction";
      ZodFirstPartyTypeKind2["ZodLazy"] = "ZodLazy";
      ZodFirstPartyTypeKind2["ZodLiteral"] = "ZodLiteral";
      ZodFirstPartyTypeKind2["ZodEnum"] = "ZodEnum";
      ZodFirstPartyTypeKind2["ZodEffects"] = "ZodEffects";
      ZodFirstPartyTypeKind2["ZodNativeEnum"] = "ZodNativeEnum";
      ZodFirstPartyTypeKind2["ZodOptional"] = "ZodOptional";
      ZodFirstPartyTypeKind2["ZodNullable"] = "ZodNullable";
      ZodFirstPartyTypeKind2["ZodDefault"] = "ZodDefault";
      ZodFirstPartyTypeKind2["ZodCatch"] = "ZodCatch";
      ZodFirstPartyTypeKind2["ZodPromise"] = "ZodPromise";
      ZodFirstPartyTypeKind2["ZodBranded"] = "ZodBranded";
      ZodFirstPartyTypeKind2["ZodPipeline"] = "ZodPipeline";
      ZodFirstPartyTypeKind2["ZodReadonly"] = "ZodReadonly";
    })(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
    ZodAny.create;
    ZodNever.create;
    ZodArray.create;
    ZodUnion.create;
    ZodIntersection.create;
    ZodTuple.create;
    enumType = ZodEnum.create;
    ZodPromise.create;
    ZodOptional.create;
    ZodNullable.create;
    ALGORITHMS = {
      "SHA-256": "sha256-",
      "SHA-384": "sha384-",
      "SHA-512": "sha512-"
    };
    ALGORITHM_VALUES = Object.values(ALGORITHMS);
    enumType(Object.keys(ALGORITHMS)).optional().default("SHA-256");
    custom((value) => {
      if (typeof value !== "string") {
        return false;
      }
      return ALGORITHM_VALUES.some((allowedValue) => {
        return value.startsWith(allowedValue);
      });
    });
    ALLOWED_DIRECTIVES = [
      "base-uri",
      "child-src",
      "connect-src",
      "default-src",
      "fenced-frame-src",
      "font-src",
      "form-action",
      "frame-ancestors",
      "frame-src",
      "img-src",
      "manifest-src",
      "media-src",
      "object-src",
      "referrer",
      "report-to",
      "report-uri",
      "require-trusted-types-for",
      "sandbox",
      "trusted-types",
      "upgrade-insecure-requests",
      "worker-src"
    ];
    custom((value) => {
      if (typeof value !== "string") {
        return false;
      }
      return ALLOWED_DIRECTIVES.some((allowedValue) => {
        return value.startsWith(allowedValue);
      });
    });
    ALGORITHM = "AES-GCM";
    __name(decodeKey, "decodeKey");
    encoder$1 = new TextEncoder();
    decoder$1 = new TextDecoder();
    IV_LENGTH = 24;
    __name(encryptString, "encryptString");
    __name(decryptString, "decryptString");
    __name(generateCspDigest, "generateCspDigest");
    renderTemplateResultSym = Symbol.for("astro.renderTemplateResult");
    RenderTemplateResult = class {
      static {
        __name(this, "RenderTemplateResult");
      }
      [renderTemplateResultSym] = true;
      htmlParts;
      expressions;
      error;
      constructor(htmlParts, expressions) {
        this.htmlParts = htmlParts;
        this.error = void 0;
        this.expressions = expressions.map((expression) => {
          if (isPromise(expression)) {
            return Promise.resolve(expression).catch((err) => {
              if (!this.error) {
                this.error = err;
                throw err;
              }
            });
          }
          return expression;
        });
      }
      render(destination) {
        const flushers = this.expressions.map((exp) => {
          return createBufferedRenderer(destination, (bufferDestination) => {
            if (exp || exp === 0) {
              return renderChild(bufferDestination, exp);
            }
          });
        });
        let i = 0;
        const iterate = /* @__PURE__ */ __name(() => {
          while (i < this.htmlParts.length) {
            const html = this.htmlParts[i];
            const flusher = flushers[i];
            i++;
            if (html) {
              destination.write(markHTMLString(html));
            }
            if (flusher) {
              const result = flusher.flush();
              if (isPromise(result)) {
                return result.then(iterate);
              }
            }
          }
        }, "iterate");
        return iterate();
      }
    };
    __name(isRenderTemplateResult, "isRenderTemplateResult");
    __name(renderTemplate, "renderTemplate");
    slotString = Symbol.for("astro:slot-string");
    SlotString = class extends HTMLString {
      static {
        __name(this, "SlotString");
      }
      instructions;
      [slotString];
      constructor(content, instructions) {
        super(content);
        this.instructions = instructions;
        this[slotString] = true;
      }
    };
    __name(isSlotString, "isSlotString");
    __name(renderSlot, "renderSlot");
    __name(renderSlotToString, "renderSlotToString");
    __name(renderSlots, "renderSlots");
    __name(createSlotValueFromString, "createSlotValueFromString");
    internalProps = /* @__PURE__ */ new Set([
      "server:component-path",
      "server:component-export",
      "server:component-directive",
      "server:defer"
    ]);
    __name(containsServerDirective, "containsServerDirective");
    SCRIPT_RE = /<\/script/giu;
    COMMENT_RE = /<!--/gu;
    SCRIPT_REPLACER = "<\\/script";
    COMMENT_REPLACER = "\\u003C!--";
    __name(safeJsonStringify, "safeJsonStringify");
    __name(createSearchParams, "createSearchParams");
    __name(isWithinURLLimit, "isWithinURLLimit");
    ServerIslandComponent = class {
      static {
        __name(this, "ServerIslandComponent");
      }
      result;
      props;
      slots;
      displayName;
      hostId;
      islandContent;
      componentPath;
      componentExport;
      componentId;
      constructor(result, props, slots, displayName) {
        this.result = result;
        this.props = props;
        this.slots = slots;
        this.displayName = displayName;
      }
      async init() {
        const content = await this.getIslandContent();
        if (this.result.cspDestination) {
          this.result._metadata.extraScriptHashes.push(
            await generateCspDigest(SERVER_ISLAND_REPLACER, this.result.cspAlgorithm)
          );
          const contentDigest = await generateCspDigest(content, this.result.cspAlgorithm);
          this.result._metadata.extraScriptHashes.push(contentDigest);
        }
        return createThinHead();
      }
      async render(destination) {
        const hostId = await this.getHostId();
        const islandContent = await this.getIslandContent();
        destination.write(createRenderInstruction({ type: "server-island-runtime" }));
        destination.write("<!--[if astro]>server-island-start<![endif]-->");
        for (const name in this.slots) {
          if (name === "fallback") {
            await renderChild(destination, this.slots.fallback(this.result));
          }
        }
        destination.write(
          `<script type="module" data-astro-rerun data-island-id="${hostId}">${islandContent}<\/script>`
        );
      }
      getComponentPath() {
        if (this.componentPath) {
          return this.componentPath;
        }
        const componentPath = this.props["server:component-path"];
        if (!componentPath) {
          throw new Error(`Could not find server component path`);
        }
        this.componentPath = componentPath;
        return componentPath;
      }
      getComponentExport() {
        if (this.componentExport) {
          return this.componentExport;
        }
        const componentExport = this.props["server:component-export"];
        if (!componentExport) {
          throw new Error(`Could not find server component export`);
        }
        this.componentExport = componentExport;
        return componentExport;
      }
      async getHostId() {
        if (!this.hostId) {
          this.hostId = await crypto.randomUUID();
        }
        return this.hostId;
      }
      async getIslandContent() {
        if (this.islandContent) {
          return this.islandContent;
        }
        const componentPath = this.getComponentPath();
        const componentExport = this.getComponentExport();
        const componentId = this.result.serverIslandNameMap.get(componentPath);
        if (!componentId) {
          throw new Error(`Could not find server component name`);
        }
        for (const key2 of Object.keys(this.props)) {
          if (internalProps.has(key2)) {
            delete this.props[key2];
          }
        }
        const renderedSlots = {};
        for (const name in this.slots) {
          if (name !== "fallback") {
            const content = await renderSlotToString(this.result, this.slots[name]);
            renderedSlots[name] = content.toString();
          }
        }
        const key = await this.result.key;
        const propsEncrypted = Object.keys(this.props).length === 0 ? "" : await encryptString(key, JSON.stringify(this.props));
        const hostId = await this.getHostId();
        const slash2 = this.result.base.endsWith("/") ? "" : "/";
        let serverIslandUrl = `${this.result.base}${slash2}_server-islands/${componentId}${this.result.trailingSlash === "always" ? "/" : ""}`;
        const potentialSearchParams = createSearchParams(
          componentExport,
          propsEncrypted,
          safeJsonStringify(renderedSlots)
        );
        const useGETRequest = isWithinURLLimit(serverIslandUrl, potentialSearchParams);
        if (useGETRequest) {
          serverIslandUrl += "?" + potentialSearchParams.toString();
          this.result._metadata.extraHead.push(
            markHTMLString(
              `<link rel="preload" as="fetch" href="${serverIslandUrl}" crossorigin="anonymous">`
            )
          );
        }
        const method = useGETRequest ? (
          // GET request
          `let response = await fetch('${serverIslandUrl}');`
        ) : (
          // POST request
          `let data = {
	componentExport: ${safeJsonStringify(componentExport)},
	encryptedProps: ${safeJsonStringify(propsEncrypted)},
	slots: ${safeJsonStringify(renderedSlots)},
};
let response = await fetch('${serverIslandUrl}', {
	method: 'POST',
	body: JSON.stringify(data),
});`
        );
        this.islandContent = `${method}replaceServerIsland('${hostId}', response);`;
        return this.islandContent;
      }
    };
    renderServerIslandRuntime = /* @__PURE__ */ __name(() => {
      return `<script>${SERVER_ISLAND_REPLACER}<\/script>`;
    }, "renderServerIslandRuntime");
    SERVER_ISLAND_REPLACER = markHTMLString(
      `async function replaceServerIsland(id, r) {
	let s = document.querySelector(\`script[data-island-id="\${id}"]\`);
	// If there's no matching script, or the request fails then return
	if (!s || r.status !== 200 || r.headers.get('content-type')?.split(';')[0].trim() !== 'text/html') return;
	// Load the HTML before modifying the DOM in case of errors
	let html = await r.text();
	// Remove any placeholder content before the island script
	while (s.previousSibling && s.previousSibling.nodeType !== 8 && s.previousSibling.data !== '[if astro]>server-island-start<![endif]')
		s.previousSibling.remove();
	s.previousSibling?.remove();
	// Insert the new HTML
	s.before(document.createRange().createContextualFragment(html));
	// Remove the script. Prior to v5.4.2, this was the trick to force rerun of scripts.  Keeping it to minimize change to the existing behavior.
	s.remove();
}`.split("\n").map((line) => line.trim()).filter((line) => line && !line.startsWith("//")).join(" ")
    );
    Fragment = Symbol.for("astro:fragment");
    Renderer = Symbol.for("astro:renderer");
    encoder = new TextEncoder();
    decoder = new TextDecoder();
    __name(stringifyChunk, "stringifyChunk");
    __name(chunkToString, "chunkToString");
    __name(chunkToByteArray, "chunkToByteArray");
    __name(isRenderInstance, "isRenderInstance");
    __name(renderChild, "renderChild");
    __name(renderArray, "renderArray");
    __name(renderIterable, "renderIterable");
    __name(renderAsyncIterable, "renderAsyncIterable");
    astroComponentInstanceSym = Symbol.for("astro.componentInstance");
    AstroComponentInstance = class {
      static {
        __name(this, "AstroComponentInstance");
      }
      [astroComponentInstanceSym] = true;
      result;
      props;
      slotValues;
      factory;
      returnValue;
      constructor(result, props, slots, factory) {
        this.result = result;
        this.props = props;
        this.factory = factory;
        this.slotValues = {};
        for (const name in slots) {
          let didRender = false;
          let value = slots[name](result);
          this.slotValues[name] = () => {
            if (!didRender) {
              didRender = true;
              return value;
            }
            return slots[name](result);
          };
        }
      }
      init(result) {
        if (this.returnValue !== void 0) {
          return this.returnValue;
        }
        this.returnValue = this.factory(result, this.props, this.slotValues);
        if (isPromise(this.returnValue)) {
          this.returnValue.then((resolved) => {
            this.returnValue = resolved;
          }).catch(() => {
          });
        }
        return this.returnValue;
      }
      render(destination) {
        const returnValue = this.init(this.result);
        if (isPromise(returnValue)) {
          return returnValue.then((x) => this.renderImpl(destination, x));
        }
        return this.renderImpl(destination, returnValue);
      }
      renderImpl(destination, returnValue) {
        if (isHeadAndContent(returnValue)) {
          return returnValue.content.render(destination);
        } else {
          return renderChild(destination, returnValue);
        }
      }
    };
    __name(validateComponentProps, "validateComponentProps");
    __name(createAstroComponentInstance, "createAstroComponentInstance");
    __name(isAstroComponentInstance, "isAstroComponentInstance");
    DOCTYPE_EXP = /<!doctype html/i;
    __name(renderToString, "renderToString");
    __name(renderToReadableStream, "renderToReadableStream");
    __name(callComponentAsTemplateResultOrResponse, "callComponentAsTemplateResultOrResponse");
    __name(bufferHeadContent, "bufferHeadContent");
    __name(renderToAsyncIterable, "renderToAsyncIterable");
    __name(toPromise, "toPromise");
    __name(componentIsHTMLElement, "componentIsHTMLElement");
    __name(renderHTMLElement, "renderHTMLElement");
    __name(getHTMLElementName, "getHTMLElementName");
    needsHeadRenderingSymbol = Symbol.for("astro.needsHeadRendering");
    rendererAliases = /* @__PURE__ */ new Map([["solid", "solid-js"]]);
    clientOnlyValues = /* @__PURE__ */ new Set(["solid-js", "react", "preact", "vue", "svelte"]);
    __name(guessRenderers, "guessRenderers");
    __name(isFragmentComponent, "isFragmentComponent");
    __name(isHTMLComponent, "isHTMLComponent");
    ASTRO_SLOT_EXP = /<\/?astro-slot\b[^>]*>/g;
    ASTRO_STATIC_SLOT_EXP = /<\/?astro-static-slot\b[^>]*>/g;
    __name(removeStaticAstroSlot, "removeStaticAstroSlot");
    __name(renderFrameworkComponent, "renderFrameworkComponent");
    __name(sanitizeElementName, "sanitizeElementName");
    __name(renderFragmentComponent, "renderFragmentComponent");
    __name(renderHTMLComponent, "renderHTMLComponent");
    __name(renderAstroComponent, "renderAstroComponent");
    __name(renderComponent, "renderComponent");
    __name(normalizeProps, "normalizeProps");
    __name(renderComponentToString, "renderComponentToString");
    __name(nonAstroPageNeedsHeadInjection, "nonAstroPageNeedsHeadInjection");
    ClientOnlyPlaceholder = "astro-client-only";
    hasTriedRenderComponentSymbol = Symbol("hasTriedRenderComponent");
    __name(renderJSX, "renderJSX");
    __name(renderJSXVNode, "renderJSXVNode");
    __name(renderElement, "renderElement");
    __name(prerenderElementChildren, "prerenderElementChildren");
    __name(renderPage, "renderPage");
    __name(renderScript, "renderScript");
    __name(requireCssesc, "requireCssesc");
    requireCssesc();
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_".split("").reduce((v, c) => (v[c.charCodeAt(0)] = c, v), []);
    "-0123456789_".split("").reduce((v, c) => (v[c.charCodeAt(0)] = c, v), []);
    __name(spreadAttributes, "spreadAttributes");
  }
});

// dist/_worker.js/chunks/astro-designed-error-pages_zET6Ym84.mjs
function is_primitive(thing) {
  return Object(thing) !== thing;
}
function is_plain_object(thing) {
  const proto = Object.getPrototypeOf(thing);
  return proto === Object.prototype || proto === null || Object.getOwnPropertyNames(proto).sort().join("\0") === object_proto_names;
}
function get_type(thing) {
  return Object.prototype.toString.call(thing).slice(8, -1);
}
function get_escaped_char(char) {
  switch (char) {
    case '"':
      return '\\"';
    case "<":
      return "\\u003C";
    case "\\":
      return "\\\\";
    case "\n":
      return "\\n";
    case "\r":
      return "\\r";
    case "	":
      return "\\t";
    case "\b":
      return "\\b";
    case "\f":
      return "\\f";
    case "\u2028":
      return "\\u2028";
    case "\u2029":
      return "\\u2029";
    default:
      return char < " " ? `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}` : "";
  }
}
function stringify_string(str) {
  let result = "";
  let last_pos = 0;
  const len = str.length;
  for (let i = 0; i < len; i += 1) {
    const char = str[i];
    const replacement = get_escaped_char(char);
    if (replacement) {
      result += str.slice(last_pos, i) + replacement;
      last_pos = i + 1;
    }
  }
  return `"${last_pos === 0 ? str : result + str.slice(last_pos)}"`;
}
function enumerable_symbols(object) {
  return Object.getOwnPropertySymbols(object).filter(
    (symbol) => Object.getOwnPropertyDescriptor(object, symbol).enumerable
  );
}
function stringify_key(key) {
  return is_identifier.test(key) ? "." + key : "[" + JSON.stringify(key) + "]";
}
function encode64(arraybuffer) {
  const dv = new DataView(arraybuffer);
  let binaryString = "";
  for (let i = 0; i < arraybuffer.byteLength; i++) {
    binaryString += String.fromCharCode(dv.getUint8(i));
  }
  return binaryToAscii(binaryString);
}
function decode64(string) {
  const binaryString = asciiToBinary(string);
  const arraybuffer = new ArrayBuffer(binaryString.length);
  const dv = new DataView(arraybuffer);
  for (let i = 0; i < arraybuffer.byteLength; i++) {
    dv.setUint8(i, binaryString.charCodeAt(i));
  }
  return arraybuffer;
}
function asciiToBinary(data) {
  if (data.length % 4 === 0) {
    data = data.replace(/==?$/, "");
  }
  let output = "";
  let buffer = 0;
  let accumulatedBits = 0;
  for (let i = 0; i < data.length; i++) {
    buffer <<= 6;
    buffer |= KEY_STRING.indexOf(data[i]);
    accumulatedBits += 6;
    if (accumulatedBits === 24) {
      output += String.fromCharCode((buffer & 16711680) >> 16);
      output += String.fromCharCode((buffer & 65280) >> 8);
      output += String.fromCharCode(buffer & 255);
      buffer = accumulatedBits = 0;
    }
  }
  if (accumulatedBits === 12) {
    buffer >>= 4;
    output += String.fromCharCode(buffer);
  } else if (accumulatedBits === 18) {
    buffer >>= 2;
    output += String.fromCharCode((buffer & 65280) >> 8);
    output += String.fromCharCode(buffer & 255);
  }
  return output;
}
function binaryToAscii(str) {
  let out = "";
  for (let i = 0; i < str.length; i += 3) {
    const groupsOfSix = [void 0, void 0, void 0, void 0];
    groupsOfSix[0] = str.charCodeAt(i) >> 2;
    groupsOfSix[1] = (str.charCodeAt(i) & 3) << 4;
    if (str.length > i + 1) {
      groupsOfSix[1] |= str.charCodeAt(i + 1) >> 4;
      groupsOfSix[2] = (str.charCodeAt(i + 1) & 15) << 2;
    }
    if (str.length > i + 2) {
      groupsOfSix[2] |= str.charCodeAt(i + 2) >> 6;
      groupsOfSix[3] = str.charCodeAt(i + 2) & 63;
    }
    for (let j = 0; j < groupsOfSix.length; j++) {
      if (typeof groupsOfSix[j] === "undefined") {
        out += "=";
      } else {
        out += KEY_STRING[groupsOfSix[j]];
      }
    }
  }
  return out;
}
function parse(serialized, revivers) {
  return unflatten(JSON.parse(serialized), revivers);
}
function unflatten(parsed, revivers) {
  if (typeof parsed === "number") return hydrate(parsed, true);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("Invalid input");
  }
  const values = (
    /** @type {any[]} */
    parsed
  );
  const hydrated = Array(values.length);
  function hydrate(index, standalone = false) {
    if (index === UNDEFINED) return void 0;
    if (index === NAN) return NaN;
    if (index === POSITIVE_INFINITY) return Infinity;
    if (index === NEGATIVE_INFINITY) return -Infinity;
    if (index === NEGATIVE_ZERO) return -0;
    if (standalone) throw new Error(`Invalid input`);
    if (index in hydrated) return hydrated[index];
    const value = values[index];
    if (!value || typeof value !== "object") {
      hydrated[index] = value;
    } else if (Array.isArray(value)) {
      if (typeof value[0] === "string") {
        const type = value[0];
        const reviver = revivers?.[type];
        if (reviver) {
          return hydrated[index] = reviver(hydrate(value[1]));
        }
        switch (type) {
          case "Date":
            hydrated[index] = new Date(value[1]);
            break;
          case "Set":
            const set = /* @__PURE__ */ new Set();
            hydrated[index] = set;
            for (let i = 1; i < value.length; i += 1) {
              set.add(hydrate(value[i]));
            }
            break;
          case "Map":
            const map = /* @__PURE__ */ new Map();
            hydrated[index] = map;
            for (let i = 1; i < value.length; i += 2) {
              map.set(hydrate(value[i]), hydrate(value[i + 1]));
            }
            break;
          case "RegExp":
            hydrated[index] = new RegExp(value[1], value[2]);
            break;
          case "Object":
            hydrated[index] = Object(value[1]);
            break;
          case "BigInt":
            hydrated[index] = BigInt(value[1]);
            break;
          case "null":
            const obj = /* @__PURE__ */ Object.create(null);
            hydrated[index] = obj;
            for (let i = 1; i < value.length; i += 2) {
              obj[value[i]] = hydrate(value[i + 1]);
            }
            break;
          case "Int8Array":
          case "Uint8Array":
          case "Uint8ClampedArray":
          case "Int16Array":
          case "Uint16Array":
          case "Int32Array":
          case "Uint32Array":
          case "Float32Array":
          case "Float64Array":
          case "BigInt64Array":
          case "BigUint64Array": {
            const TypedArrayConstructor = globalThis[type];
            const base64 = value[1];
            const arraybuffer = decode64(base64);
            const typedArray = new TypedArrayConstructor(arraybuffer);
            hydrated[index] = typedArray;
            break;
          }
          case "ArrayBuffer": {
            const base64 = value[1];
            const arraybuffer = decode64(base64);
            hydrated[index] = arraybuffer;
            break;
          }
          default:
            throw new Error(`Unknown type ${type}`);
        }
      } else {
        const array = new Array(value.length);
        hydrated[index] = array;
        for (let i = 0; i < value.length; i += 1) {
          const n = value[i];
          if (n === HOLE) continue;
          array[i] = hydrate(n);
        }
      }
    } else {
      const object = {};
      hydrated[index] = object;
      for (const key in value) {
        const n = value[key];
        object[key] = hydrate(n);
      }
    }
    return hydrated[index];
  }
  __name(hydrate, "hydrate");
  return hydrate(0);
}
function stringify(value, reducers) {
  const stringified = [];
  const indexes = /* @__PURE__ */ new Map();
  const custom2 = [];
  if (reducers) {
    for (const key of Object.getOwnPropertyNames(reducers)) {
      custom2.push({ key, fn: reducers[key] });
    }
  }
  const keys = [];
  let p = 0;
  function flatten(thing) {
    if (typeof thing === "function") {
      throw new DevalueError(`Cannot stringify a function`, keys);
    }
    if (indexes.has(thing)) return indexes.get(thing);
    if (thing === void 0) return UNDEFINED;
    if (Number.isNaN(thing)) return NAN;
    if (thing === Infinity) return POSITIVE_INFINITY;
    if (thing === -Infinity) return NEGATIVE_INFINITY;
    if (thing === 0 && 1 / thing < 0) return NEGATIVE_ZERO;
    const index2 = p++;
    indexes.set(thing, index2);
    for (const { key, fn } of custom2) {
      const value2 = fn(thing);
      if (value2) {
        stringified[index2] = `["${key}",${flatten(value2)}]`;
        return index2;
      }
    }
    let str = "";
    if (is_primitive(thing)) {
      str = stringify_primitive(thing);
    } else {
      const type = get_type(thing);
      switch (type) {
        case "Number":
        case "String":
        case "Boolean":
          str = `["Object",${stringify_primitive(thing)}]`;
          break;
        case "BigInt":
          str = `["BigInt",${thing}]`;
          break;
        case "Date":
          const valid = !isNaN(thing.getDate());
          str = `["Date","${valid ? thing.toISOString() : ""}"]`;
          break;
        case "RegExp":
          const { source, flags } = thing;
          str = flags ? `["RegExp",${stringify_string(source)},"${flags}"]` : `["RegExp",${stringify_string(source)}]`;
          break;
        case "Array":
          str = "[";
          for (let i = 0; i < thing.length; i += 1) {
            if (i > 0) str += ",";
            if (i in thing) {
              keys.push(`[${i}]`);
              str += flatten(thing[i]);
              keys.pop();
            } else {
              str += HOLE;
            }
          }
          str += "]";
          break;
        case "Set":
          str = '["Set"';
          for (const value2 of thing) {
            str += `,${flatten(value2)}`;
          }
          str += "]";
          break;
        case "Map":
          str = '["Map"';
          for (const [key, value2] of thing) {
            keys.push(
              `.get(${is_primitive(key) ? stringify_primitive(key) : "..."})`
            );
            str += `,${flatten(key)},${flatten(value2)}`;
            keys.pop();
          }
          str += "]";
          break;
        case "Int8Array":
        case "Uint8Array":
        case "Uint8ClampedArray":
        case "Int16Array":
        case "Uint16Array":
        case "Int32Array":
        case "Uint32Array":
        case "Float32Array":
        case "Float64Array":
        case "BigInt64Array":
        case "BigUint64Array": {
          const typedArray = thing;
          const base64 = encode64(typedArray.buffer);
          str = '["' + type + '","' + base64 + '"]';
          break;
        }
        case "ArrayBuffer": {
          const arraybuffer = thing;
          const base64 = encode64(arraybuffer);
          str = `["ArrayBuffer","${base64}"]`;
          break;
        }
        default:
          if (!is_plain_object(thing)) {
            throw new DevalueError(
              `Cannot stringify arbitrary non-POJOs`,
              keys
            );
          }
          if (enumerable_symbols(thing).length > 0) {
            throw new DevalueError(
              `Cannot stringify POJOs with symbolic keys`,
              keys
            );
          }
          if (Object.getPrototypeOf(thing) === null) {
            str = '["null"';
            for (const key in thing) {
              keys.push(stringify_key(key));
              str += `,${stringify_string(key)},${flatten(thing[key])}`;
              keys.pop();
            }
            str += "]";
          } else {
            str = "{";
            let started = false;
            for (const key in thing) {
              if (started) str += ",";
              started = true;
              keys.push(stringify_key(key));
              str += `${stringify_string(key)}:${flatten(thing[key])}`;
              keys.pop();
            }
            str += "}";
          }
      }
    }
    stringified[index2] = str;
    return index2;
  }
  __name(flatten, "flatten");
  const index = flatten(value);
  if (index < 0) return `${index}`;
  return `[${stringified.join(",")}]`;
}
function stringify_primitive(thing) {
  const type = typeof thing;
  if (type === "string") return stringify_string(thing);
  if (thing instanceof String) return stringify_string(thing.toString());
  if (thing === void 0) return UNDEFINED.toString();
  if (thing === 0 && 1 / thing < 0) return NEGATIVE_ZERO.toString();
  if (type === "bigint") return `["BigInt","${thing}"]`;
  return String(thing);
}
function isActionError(error4) {
  return typeof error4 === "object" && error4 != null && "type" in error4 && error4.type === "AstroActionError";
}
function isInputError(error4) {
  return typeof error4 === "object" && error4 != null && "type" in error4 && error4.type === "AstroActionInputError" && "issues" in error4 && Array.isArray(error4.issues);
}
function getActionQueryString(name) {
  const searchParams = new URLSearchParams({ [ACTION_QUERY_PARAMS$1.actionName]: name });
  return `?${searchParams.toString()}`;
}
function serializeActionResult(res) {
  if (res.error) {
    if (Object.assign(__vite_import_meta_env__, { _: process.env._ })?.DEV) {
      actionResultErrorStack.set(res.error.stack);
    }
    let body2;
    if (res.error instanceof ActionInputError) {
      body2 = {
        type: res.error.type,
        issues: res.error.issues,
        fields: res.error.fields
      };
    } else {
      body2 = {
        ...res.error,
        message: res.error.message
      };
    }
    return {
      type: "error",
      status: res.error.status,
      contentType: "application/json",
      body: JSON.stringify(body2)
    };
  }
  if (res.data === void 0) {
    return {
      type: "empty",
      status: 204
    };
  }
  let body;
  try {
    body = stringify(res.data, {
      // Add support for URL objects
      URL: /* @__PURE__ */ __name((value) => value instanceof URL && value.href, "URL")
    });
  } catch (e) {
    let hint = ActionsReturnedInvalidDataError.hint;
    if (res.data instanceof Response) {
      hint = REDIRECT_STATUS_CODES.includes(res.data.status) ? "If you need to redirect when the action succeeds, trigger a redirect where the action is called. See the Actions guide for server and client redirect examples: https://docs.astro.build/en/guides/actions." : "If you need to return a Response object, try using a server endpoint instead. See https://docs.astro.build/en/guides/endpoints/#server-endpoints-api-routes";
    }
    throw new AstroError({
      ...ActionsReturnedInvalidDataError,
      message: ActionsReturnedInvalidDataError.message(String(e)),
      hint
    });
  }
  return {
    type: "data",
    status: 200,
    contentType: "application/json+devalue",
    body
  };
}
function deserializeActionResult(res) {
  if (res.type === "error") {
    let json;
    try {
      json = JSON.parse(res.body);
    } catch {
      return {
        data: void 0,
        error: new ActionError({
          message: res.body,
          code: "INTERNAL_SERVER_ERROR"
        })
      };
    }
    if (Object.assign(__vite_import_meta_env__, { _: process.env._ })?.PROD) {
      return { error: ActionError.fromJson(json), data: void 0 };
    } else {
      const error4 = ActionError.fromJson(json);
      error4.stack = actionResultErrorStack.get();
      return {
        error: error4,
        data: void 0
      };
    }
  }
  if (res.type === "empty") {
    return { data: void 0, error: void 0 };
  }
  return {
    data: parse(res.body, {
      URL: /* @__PURE__ */ __name((href) => new URL(href), "URL")
    }),
    error: void 0
  };
}
function requireDist() {
  if (hasRequiredDist) return dist;
  hasRequiredDist = 1;
  Object.defineProperty(dist, "__esModule", { value: true });
  dist.parse = parse2;
  dist.serialize = serialize;
  const cookieNameRegExp = /^[\u0021-\u003A\u003C\u003E-\u007E]+$/;
  const cookieValueRegExp = /^[\u0021-\u003A\u003C-\u007E]*$/;
  const domainValueRegExp = /^([.]?[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)([.][a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i;
  const pathValueRegExp = /^[\u0020-\u003A\u003D-\u007E]*$/;
  const __toString = Object.prototype.toString;
  const NullObject = /* @__PURE__ */ (() => {
    const C = /* @__PURE__ */ __name(function() {
    }, "C");
    C.prototype = /* @__PURE__ */ Object.create(null);
    return C;
  })();
  function parse2(str, options) {
    const obj = new NullObject();
    const len = str.length;
    if (len < 2)
      return obj;
    const dec = options?.decode || decode;
    let index = 0;
    do {
      const eqIdx = str.indexOf("=", index);
      if (eqIdx === -1)
        break;
      const colonIdx = str.indexOf(";", index);
      const endIdx = colonIdx === -1 ? len : colonIdx;
      if (eqIdx > endIdx) {
        index = str.lastIndexOf(";", eqIdx - 1) + 1;
        continue;
      }
      const keyStartIdx = startIndex(str, index, eqIdx);
      const keyEndIdx = endIndex(str, eqIdx, keyStartIdx);
      const key = str.slice(keyStartIdx, keyEndIdx);
      if (obj[key] === void 0) {
        let valStartIdx = startIndex(str, eqIdx + 1, endIdx);
        let valEndIdx = endIndex(str, endIdx, valStartIdx);
        const value = dec(str.slice(valStartIdx, valEndIdx));
        obj[key] = value;
      }
      index = endIdx + 1;
    } while (index < len);
    return obj;
  }
  __name(parse2, "parse");
  function startIndex(str, index, max) {
    do {
      const code = str.charCodeAt(index);
      if (code !== 32 && code !== 9)
        return index;
    } while (++index < max);
    return max;
  }
  __name(startIndex, "startIndex");
  function endIndex(str, index, min) {
    while (index > min) {
      const code = str.charCodeAt(--index);
      if (code !== 32 && code !== 9)
        return index + 1;
    }
    return min;
  }
  __name(endIndex, "endIndex");
  function serialize(name, val, options) {
    const enc = options?.encode || encodeURIComponent;
    if (!cookieNameRegExp.test(name)) {
      throw new TypeError(`argument name is invalid: ${name}`);
    }
    const value = enc(val);
    if (!cookieValueRegExp.test(value)) {
      throw new TypeError(`argument val is invalid: ${val}`);
    }
    let str = name + "=" + value;
    if (!options)
      return str;
    if (options.maxAge !== void 0) {
      if (!Number.isInteger(options.maxAge)) {
        throw new TypeError(`option maxAge is invalid: ${options.maxAge}`);
      }
      str += "; Max-Age=" + options.maxAge;
    }
    if (options.domain) {
      if (!domainValueRegExp.test(options.domain)) {
        throw new TypeError(`option domain is invalid: ${options.domain}`);
      }
      str += "; Domain=" + options.domain;
    }
    if (options.path) {
      if (!pathValueRegExp.test(options.path)) {
        throw new TypeError(`option path is invalid: ${options.path}`);
      }
      str += "; Path=" + options.path;
    }
    if (options.expires) {
      if (!isDate(options.expires) || !Number.isFinite(options.expires.valueOf())) {
        throw new TypeError(`option expires is invalid: ${options.expires}`);
      }
      str += "; Expires=" + options.expires.toUTCString();
    }
    if (options.httpOnly) {
      str += "; HttpOnly";
    }
    if (options.secure) {
      str += "; Secure";
    }
    if (options.partitioned) {
      str += "; Partitioned";
    }
    if (options.priority) {
      const priority = typeof options.priority === "string" ? options.priority.toLowerCase() : void 0;
      switch (priority) {
        case "low":
          str += "; Priority=Low";
          break;
        case "medium":
          str += "; Priority=Medium";
          break;
        case "high":
          str += "; Priority=High";
          break;
        default:
          throw new TypeError(`option priority is invalid: ${options.priority}`);
      }
    }
    if (options.sameSite) {
      const sameSite = typeof options.sameSite === "string" ? options.sameSite.toLowerCase() : options.sameSite;
      switch (sameSite) {
        case true:
        case "strict":
          str += "; SameSite=Strict";
          break;
        case "lax":
          str += "; SameSite=Lax";
          break;
        case "none":
          str += "; SameSite=None";
          break;
        default:
          throw new TypeError(`option sameSite is invalid: ${options.sameSite}`);
      }
    }
    return str;
  }
  __name(serialize, "serialize");
  function decode(str) {
    if (str.indexOf("%") === -1)
      return str;
    try {
      return decodeURIComponent(str);
    } catch (e) {
      return str;
    }
  }
  __name(decode, "decode");
  function isDate(val) {
    return __toString.call(val) === "[object Date]";
  }
  __name(isDate, "isDate");
  return dist;
}
function template({
  title: title2,
  pathname,
  statusCode = 404,
  tabTitle,
  body
}) {
  return `<!doctype html>
<html lang="en">
	<head>
		<meta charset="UTF-8">
		<title>${tabTitle}</title>
		<style>
			:root {
				--gray-10: hsl(258, 7%, 10%);
				--gray-20: hsl(258, 7%, 20%);
				--gray-30: hsl(258, 7%, 30%);
				--gray-40: hsl(258, 7%, 40%);
				--gray-50: hsl(258, 7%, 50%);
				--gray-60: hsl(258, 7%, 60%);
				--gray-70: hsl(258, 7%, 70%);
				--gray-80: hsl(258, 7%, 80%);
				--gray-90: hsl(258, 7%, 90%);
				--black: #13151A;
				--accent-light: #E0CCFA;
			}

			* {
				box-sizing: border-box;
			}

			html {
				background: var(--black);
				color-scheme: dark;
				accent-color: var(--accent-light);
			}

			body {
				background-color: var(--gray-10);
				color: var(--gray-80);
				font-family: ui-monospace, Menlo, Monaco, "Cascadia Mono", "Segoe UI Mono", "Roboto Mono", "Oxygen Mono", "Ubuntu Monospace", "Source Code Pro", "Fira Mono", "Droid Sans Mono", "Courier New", monospace;
				line-height: 1.5;
				margin: 0;
			}

			a {
				color: var(--accent-light);
			}

			.center {
				display: flex;
				flex-direction: column;
				justify-content: center;
				align-items: center;
				height: 100vh;
				width: 100vw;
			}

			h1 {
				margin-bottom: 8px;
				color: white;
				font-family: system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
				font-weight: 700;
				margin-top: 1rem;
				margin-bottom: 0;
			}

			.statusCode {
				color: var(--accent-light);
			}

			.astro-icon {
				height: 124px;
				width: 124px;
			}

			pre, code {
				padding: 2px 8px;
				background: rgba(0,0,0, 0.25);
				border: 1px solid rgba(255,255,255, 0.25);
				border-radius: 4px;
				font-size: 1.2em;
				margin-top: 0;
				max-width: 60em;
			}
		</style>
	</head>
	<body>
		<main class="center">
			<svg class="astro-icon" xmlns="http://www.w3.org/2000/svg" width="64" height="80" viewBox="0 0 64 80" fill="none"> <path d="M20.5253 67.6322C16.9291 64.3531 15.8793 57.4632 17.3776 52.4717C19.9755 55.6188 23.575 56.6157 27.3035 57.1784C33.0594 58.0468 38.7122 57.722 44.0592 55.0977C44.6709 54.7972 45.2362 54.3978 45.9045 53.9931C46.4062 55.4451 46.5368 56.9109 46.3616 58.4028C45.9355 62.0362 44.1228 64.8429 41.2397 66.9705C40.0868 67.8215 38.8669 68.5822 37.6762 69.3846C34.0181 71.8508 33.0285 74.7426 34.403 78.9491C34.4357 79.0516 34.4649 79.1541 34.5388 79.4042C32.6711 78.5705 31.3069 77.3565 30.2674 75.7604C29.1694 74.0757 28.6471 72.2121 28.6196 70.1957C28.6059 69.2144 28.6059 68.2244 28.4736 67.257C28.1506 64.8985 27.0406 63.8425 24.9496 63.7817C22.8036 63.7192 21.106 65.0426 20.6559 67.1268C20.6215 67.2865 20.5717 67.4446 20.5218 67.6304L20.5253 67.6322Z" fill="white"/> <path d="M20.5253 67.6322C16.9291 64.3531 15.8793 57.4632 17.3776 52.4717C19.9755 55.6188 23.575 56.6157 27.3035 57.1784C33.0594 58.0468 38.7122 57.722 44.0592 55.0977C44.6709 54.7972 45.2362 54.3978 45.9045 53.9931C46.4062 55.4451 46.5368 56.9109 46.3616 58.4028C45.9355 62.0362 44.1228 64.8429 41.2397 66.9705C40.0868 67.8215 38.8669 68.5822 37.6762 69.3846C34.0181 71.8508 33.0285 74.7426 34.403 78.9491C34.4357 79.0516 34.4649 79.1541 34.5388 79.4042C32.6711 78.5705 31.3069 77.3565 30.2674 75.7604C29.1694 74.0757 28.6471 72.2121 28.6196 70.1957C28.6059 69.2144 28.6059 68.2244 28.4736 67.257C28.1506 64.8985 27.0406 63.8425 24.9496 63.7817C22.8036 63.7192 21.106 65.0426 20.6559 67.1268C20.6215 67.2865 20.5717 67.4446 20.5218 67.6304L20.5253 67.6322Z" fill="url(#paint0_linear_738_686)"/> <path d="M0 51.6401C0 51.6401 10.6488 46.4654 21.3274 46.4654L29.3786 21.6102C29.6801 20.4082 30.5602 19.5913 31.5538 19.5913C32.5474 19.5913 33.4275 20.4082 33.7289 21.6102L41.7802 46.4654C54.4274 46.4654 63.1076 51.6401 63.1076 51.6401C63.1076 51.6401 45.0197 2.48776 44.9843 2.38914C44.4652 0.935933 43.5888 0 42.4073 0H20.7022C19.5206 0 18.6796 0.935933 18.1251 2.38914C18.086 2.4859 0 51.6401 0 51.6401Z" fill="white"/> <defs> <linearGradient id="paint0_linear_738_686" x1="31.554" y1="75.4423" x2="39.7462" y2="48.376" gradientUnits="userSpaceOnUse"> <stop stop-color="#D83333"/> <stop offset="1" stop-color="#F041FF"/> </linearGradient> </defs> </svg>
			<h1>${statusCode ? `<span class="statusCode">${statusCode}: </span> ` : ""}<span class="statusMessage">${title2}</span></h1>
			${body || `
				<pre>Path: ${escape(pathname)}</pre>
			`}
			</main>
	</body>
</html>`;
}
function ensure404Route(manifest2) {
  if (!manifest2.routes.some((route) => route.route === "/404")) {
    manifest2.routes.push(DEFAULT_404_ROUTE);
  }
  return manifest2;
}
async function default404Page({ pathname }) {
  return new Response(
    template({
      statusCode: 404,
      title: "Not found",
      tabTitle: "404: Not Found",
      pathname
    }),
    { status: 404, headers: { "Content-Type": "text/html" } }
  );
}
var ImportType, E, DevalueError, object_proto_names, is_identifier, KEY_STRING, UNDEFINED, HOLE, NAN, POSITIVE_INFINITY, NEGATIVE_INFINITY, NEGATIVE_ZERO, ACTION_QUERY_PARAMS$1, ACTION_RPC_ROUTE_PATTERN, __vite_import_meta_env__, ACTION_QUERY_PARAMS, codeToStatusMap, statusToCodeMap, ActionError, ActionInputError, actionResultErrorStack, dist, hasRequiredDist, distExports, DEFAULT_404_ROUTE, default404Instance;
var init_astro_designed_error_pages_zET6Ym84 = __esm({
  "dist/_worker.js/chunks/astro-designed-error-pages_zET6Ym84.mjs"() {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_server_BRKsKzpO();
    globalThis.process ??= {};
    globalThis.process.env ??= {};
    !function(A) {
      A[A.Static = 1] = "Static", A[A.Dynamic = 2] = "Dynamic", A[A.ImportMeta = 3] = "ImportMeta", A[A.StaticSourcePhase = 4] = "StaticSourcePhase", A[A.DynamicSourcePhase = 5] = "DynamicSourcePhase", A[A.StaticDeferPhase = 6] = "StaticDeferPhase", A[A.DynamicDeferPhase = 7] = "DynamicDeferPhase";
    }(ImportType || (ImportType = {}));
    1 === new Uint8Array(new Uint16Array([1]).buffer)[0];
    E = /* @__PURE__ */ __name(() => {
      return A = "AGFzbQEAAAABKwhgAX8Bf2AEf39/fwBgAAF/YAAAYAF/AGADf39/AX9gAn9/AX9gA39/fwADMTAAAQECAgICAgICAgICAgICAgICAgIAAwMDBAQAAAUAAAAAAAMDAwAGAAAABwAGAgUEBQFwAQEBBQMBAAEGDwJ/AUHA8gALfwBBwPIACwd6FQZtZW1vcnkCAAJzYQAAAWUAAwJpcwAEAmllAAUCc3MABgJzZQAHAml0AAgCYWkACQJpZAAKAmlwAAsCZXMADAJlZQANA2VscwAOA2VsZQAPAnJpABACcmUAEQFmABICbXMAEwVwYXJzZQAUC19faGVhcF9iYXNlAwEKzkQwaAEBf0EAIAA2AoAKQQAoAtwJIgEgAEEBdGoiAEEAOwEAQQAgAEECaiIANgKECkEAIAA2AogKQQBBADYC4AlBAEEANgLwCUEAQQA2AugJQQBBADYC5AlBAEEANgL4CUEAQQA2AuwJIAEL0wEBA39BACgC8AkhBEEAQQAoAogKIgU2AvAJQQAgBDYC9AlBACAFQSRqNgKICiAEQSBqQeAJIAQbIAU2AgBBACgC1AkhBEEAKALQCSEGIAUgATYCACAFIAA2AgggBSACIAJBAmpBACAGIANGIgAbIAQgA0YiBBs2AgwgBSADNgIUIAVBADYCECAFIAI2AgQgBUEANgIgIAVBA0EBQQIgABsgBBs2AhwgBUEAKALQCSADRiICOgAYAkACQCACDQBBACgC1AkgA0cNAQtBAEEBOgCMCgsLXgEBf0EAKAL4CSIEQRBqQeQJIAQbQQAoAogKIgQ2AgBBACAENgL4CUEAIARBFGo2AogKQQBBAToAjAogBEEANgIQIAQgAzYCDCAEIAI2AgggBCABNgIEIAQgADYCAAsIAEEAKAKQCgsVAEEAKALoCSgCAEEAKALcCWtBAXULHgEBf0EAKALoCSgCBCIAQQAoAtwJa0EBdUF/IAAbCxUAQQAoAugJKAIIQQAoAtwJa0EBdQseAQF/QQAoAugJKAIMIgBBACgC3AlrQQF1QX8gABsLCwBBACgC6AkoAhwLHgEBf0EAKALoCSgCECIAQQAoAtwJa0EBdUF/IAAbCzsBAX8CQEEAKALoCSgCFCIAQQAoAtAJRw0AQX8PCwJAIABBACgC1AlHDQBBfg8LIABBACgC3AlrQQF1CwsAQQAoAugJLQAYCxUAQQAoAuwJKAIAQQAoAtwJa0EBdQsVAEEAKALsCSgCBEEAKALcCWtBAXULHgEBf0EAKALsCSgCCCIAQQAoAtwJa0EBdUF/IAAbCx4BAX9BACgC7AkoAgwiAEEAKALcCWtBAXVBfyAAGwslAQF/QQBBACgC6AkiAEEgakHgCSAAGygCACIANgLoCSAAQQBHCyUBAX9BAEEAKALsCSIAQRBqQeQJIAAbKAIAIgA2AuwJIABBAEcLCABBAC0AlAoLCABBAC0AjAoL3Q0BBX8jAEGA0ABrIgAkAEEAQQE6AJQKQQBBACgC2Ak2ApwKQQBBACgC3AlBfmoiATYCsApBACABQQAoAoAKQQF0aiICNgK0CkEAQQA6AIwKQQBBADsBlgpBAEEAOwGYCkEAQQA6AKAKQQBBADYCkApBAEEAOgD8CUEAIABBgBBqNgKkCkEAIAA2AqgKQQBBADoArAoCQAJAAkACQANAQQAgAUECaiIDNgKwCiABIAJPDQECQCADLwEAIgJBd2pBBUkNAAJAAkACQAJAAkAgAkGbf2oOBQEICAgCAAsgAkEgRg0EIAJBL0YNAyACQTtGDQIMBwtBAC8BmAoNASADEBVFDQEgAUEEakGCCEEKEC8NARAWQQAtAJQKDQFBAEEAKAKwCiIBNgKcCgwHCyADEBVFDQAgAUEEakGMCEEKEC8NABAXC0EAQQAoArAKNgKcCgwBCwJAIAEvAQQiA0EqRg0AIANBL0cNBBAYDAELQQEQGQtBACgCtAohAkEAKAKwCiEBDAALC0EAIQIgAyEBQQAtAPwJDQIMAQtBACABNgKwCkEAQQA6AJQKCwNAQQAgAUECaiIDNgKwCgJAAkACQAJAAkACQAJAIAFBACgCtApPDQAgAy8BACICQXdqQQVJDQYCQAJAAkACQAJAAkACQAJAAkACQCACQWBqDgoQDwYPDw8PBQECAAsCQAJAAkACQCACQaB/ag4KCxISAxIBEhISAgALIAJBhX9qDgMFEQYJC0EALwGYCg0QIAMQFUUNECABQQRqQYIIQQoQLw0QEBYMEAsgAxAVRQ0PIAFBBGpBjAhBChAvDQ8QFwwPCyADEBVFDQ4gASkABELsgISDsI7AOVINDiABLwEMIgNBd2oiAUEXSw0MQQEgAXRBn4CABHFFDQwMDQtBAEEALwGYCiIBQQFqOwGYCkEAKAKkCiABQQN0aiIBQQE2AgAgAUEAKAKcCjYCBAwNC0EALwGYCiIDRQ0JQQAgA0F/aiIDOwGYCkEALwGWCiICRQ0MQQAoAqQKIANB//8DcUEDdGooAgBBBUcNDAJAIAJBAnRBACgCqApqQXxqKAIAIgMoAgQNACADQQAoApwKQQJqNgIEC0EAIAJBf2o7AZYKIAMgAUEEajYCDAwMCwJAQQAoApwKIgEvAQBBKUcNAEEAKALwCSIDRQ0AIAMoAgQgAUcNAEEAQQAoAvQJIgM2AvAJAkAgA0UNACADQQA2AiAMAQtBAEEANgLgCQtBAEEALwGYCiIDQQFqOwGYCkEAKAKkCiADQQN0aiIDQQZBAkEALQCsChs2AgAgAyABNgIEQQBBADoArAoMCwtBAC8BmAoiAUUNB0EAIAFBf2oiATsBmApBACgCpAogAUH//wNxQQN0aigCAEEERg0EDAoLQScQGgwJC0EiEBoMCAsgAkEvRw0HAkACQCABLwEEIgFBKkYNACABQS9HDQEQGAwKC0EBEBkMCQsCQAJAAkACQEEAKAKcCiIBLwEAIgMQG0UNAAJAAkAgA0FVag4EAAkBAwkLIAFBfmovAQBBK0YNAwwICyABQX5qLwEAQS1GDQIMBwsgA0EpRw0BQQAoAqQKQQAvAZgKIgJBA3RqKAIEEBxFDQIMBgsgAUF+ai8BAEFQakH//wNxQQpPDQULQQAvAZgKIQILAkACQCACQf//A3EiAkUNACADQeYARw0AQQAoAqQKIAJBf2pBA3RqIgQoAgBBAUcNACABQX5qLwEAQe8ARw0BIAQoAgRBlghBAxAdRQ0BDAULIANB/QBHDQBBACgCpAogAkEDdGoiAigCBBAeDQQgAigCAEEGRg0ECyABEB8NAyADRQ0DIANBL0ZBAC0AoApBAEdxDQMCQEEAKAL4CSICRQ0AIAEgAigCAEkNACABIAIoAgRNDQQLIAFBfmohAUEAKALcCSECAkADQCABQQJqIgQgAk0NAUEAIAE2ApwKIAEvAQAhAyABQX5qIgQhASADECBFDQALIARBAmohBAsCQCADQf//A3EQIUUNACAEQX5qIQECQANAIAFBAmoiAyACTQ0BQQAgATYCnAogAS8BACEDIAFBfmoiBCEBIAMQIQ0ACyAEQQJqIQMLIAMQIg0EC0EAQQE6AKAKDAcLQQAoAqQKQQAvAZgKIgFBA3QiA2pBACgCnAo2AgRBACABQQFqOwGYCkEAKAKkCiADakEDNgIACxAjDAULQQAtAPwJQQAvAZYKQQAvAZgKcnJFIQIMBwsQJEEAQQA6AKAKDAMLECVBACECDAULIANBoAFHDQELQQBBAToArAoLQQBBACgCsAo2ApwKC0EAKAKwCiEBDAALCyAAQYDQAGokACACCxoAAkBBACgC3AkgAEcNAEEBDwsgAEF+ahAmC/4KAQZ/QQBBACgCsAoiAEEMaiIBNgKwCkEAKAL4CSECQQEQKSEDAkACQAJAAkACQAJAAkACQAJAQQAoArAKIgQgAUcNACADEChFDQELAkACQAJAAkACQAJAAkAgA0EqRg0AIANB+wBHDQFBACAEQQJqNgKwCkEBECkhA0EAKAKwCiEEA0ACQAJAIANB//8DcSIDQSJGDQAgA0EnRg0AIAMQLBpBACgCsAohAwwBCyADEBpBAEEAKAKwCkECaiIDNgKwCgtBARApGgJAIAQgAxAtIgNBLEcNAEEAQQAoArAKQQJqNgKwCkEBECkhAwsgA0H9AEYNA0EAKAKwCiIFIARGDQ8gBSEEIAVBACgCtApNDQAMDwsLQQAgBEECajYCsApBARApGkEAKAKwCiIDIAMQLRoMAgtBAEEAOgCUCgJAAkACQAJAAkACQCADQZ9/ag4MAgsEAQsDCwsLCwsFAAsgA0H2AEYNBAwKC0EAIARBDmoiAzYCsAoCQAJAAkBBARApQZ9/ag4GABICEhIBEgtBACgCsAoiBSkAAkLzgOSD4I3AMVINESAFLwEKECFFDRFBACAFQQpqNgKwCkEAECkaC0EAKAKwCiIFQQJqQbIIQQ4QLw0QIAUvARAiAkF3aiIBQRdLDQ1BASABdEGfgIAEcUUNDQwOC0EAKAKwCiIFKQACQuyAhIOwjsA5Ug0PIAUvAQoiAkF3aiIBQRdNDQYMCgtBACAEQQpqNgKwCkEAECkaQQAoArAKIQQLQQAgBEEQajYCsAoCQEEBECkiBEEqRw0AQQBBACgCsApBAmo2ArAKQQEQKSEEC0EAKAKwCiEDIAQQLBogA0EAKAKwCiIEIAMgBBACQQBBACgCsApBfmo2ArAKDwsCQCAEKQACQuyAhIOwjsA5Ug0AIAQvAQoQIEUNAEEAIARBCmo2ArAKQQEQKSEEQQAoArAKIQMgBBAsGiADQQAoArAKIgQgAyAEEAJBAEEAKAKwCkF+ajYCsAoPC0EAIARBBGoiBDYCsAoLQQAgBEEGajYCsApBAEEAOgCUCkEBECkhBEEAKAKwCiEDIAQQLCEEQQAoArAKIQIgBEHf/wNxIgFB2wBHDQNBACACQQJqNgKwCkEBECkhBUEAKAKwCiEDQQAhBAwEC0EAQQE6AIwKQQBBACgCsApBAmo2ArAKC0EBECkhBEEAKAKwCiEDAkAgBEHmAEcNACADQQJqQawIQQYQLw0AQQAgA0EIajYCsAogAEEBEClBABArIAJBEGpB5AkgAhshAwNAIAMoAgAiA0UNBSADQgA3AgggA0EQaiEDDAALC0EAIANBfmo2ArAKDAMLQQEgAXRBn4CABHFFDQMMBAtBASEECwNAAkACQCAEDgIAAQELIAVB//8DcRAsGkEBIQQMAQsCQAJAQQAoArAKIgQgA0YNACADIAQgAyAEEAJBARApIQQCQCABQdsARw0AIARBIHJB/QBGDQQLQQAoArAKIQMCQCAEQSxHDQBBACADQQJqNgKwCkEBECkhBUEAKAKwCiEDIAVBIHJB+wBHDQILQQAgA0F+ajYCsAoLIAFB2wBHDQJBACACQX5qNgKwCg8LQQAhBAwACwsPCyACQaABRg0AIAJB+wBHDQQLQQAgBUEKajYCsApBARApIgVB+wBGDQMMAgsCQCACQVhqDgMBAwEACyACQaABRw0CC0EAIAVBEGo2ArAKAkBBARApIgVBKkcNAEEAQQAoArAKQQJqNgKwCkEBECkhBQsgBUEoRg0BC0EAKAKwCiEBIAUQLBpBACgCsAoiBSABTQ0AIAQgAyABIAUQAkEAQQAoArAKQX5qNgKwCg8LIAQgA0EAQQAQAkEAIARBDGo2ArAKDwsQJQuFDAEKf0EAQQAoArAKIgBBDGoiATYCsApBARApIQJBACgCsAohAwJAAkACQAJAAkACQAJAAkAgAkEuRw0AQQAgA0ECajYCsAoCQEEBECkiAkHkAEYNAAJAIAJB8wBGDQAgAkHtAEcNB0EAKAKwCiICQQJqQZwIQQYQLw0HAkBBACgCnAoiAxAqDQAgAy8BAEEuRg0ICyAAIAAgAkEIakEAKALUCRABDwtBACgCsAoiAkECakGiCEEKEC8NBgJAQQAoApwKIgMQKg0AIAMvAQBBLkYNBwtBACEEQQAgAkEMajYCsApBASEFQQUhBkEBECkhAkEAIQdBASEIDAILQQAoArAKIgIpAAJC5YCYg9CMgDlSDQUCQEEAKAKcCiIDECoNACADLwEAQS5GDQYLQQAhBEEAIAJBCmo2ArAKQQIhCEEHIQZBASEHQQEQKSECQQEhBQwBCwJAAkACQAJAIAJB8wBHDQAgAyABTQ0AIANBAmpBoghBChAvDQACQCADLwEMIgRBd2oiB0EXSw0AQQEgB3RBn4CABHENAgsgBEGgAUYNAQtBACEHQQchBkEBIQQgAkHkAEYNAQwCC0EAIQRBACADQQxqIgI2ArAKQQEhBUEBECkhCQJAQQAoArAKIgYgAkYNAEHmACECAkAgCUHmAEYNAEEFIQZBACEHQQEhCCAJIQIMBAtBACEHQQEhCCAGQQJqQawIQQYQLw0EIAYvAQgQIEUNBAtBACEHQQAgAzYCsApBByEGQQEhBEEAIQVBACEIIAkhAgwCCyADIABBCmpNDQBBACEIQeQAIQICQCADKQACQuWAmIPQjIA5Ug0AAkACQCADLwEKIgRBd2oiB0EXSw0AQQEgB3RBn4CABHENAQtBACEIIARBoAFHDQELQQAhBUEAIANBCmo2ArAKQSohAkEBIQdBAiEIQQEQKSIJQSpGDQRBACADNgKwCkEBIQRBACEHQQAhCCAJIQIMAgsgAyEGQQAhBwwCC0EAIQVBACEICwJAIAJBKEcNAEEAKAKkCkEALwGYCiICQQN0aiIDQQAoArAKNgIEQQAgAkEBajsBmAogA0EFNgIAQQAoApwKLwEAQS5GDQRBAEEAKAKwCiIDQQJqNgKwCkEBECkhAiAAQQAoArAKQQAgAxABAkACQCAFDQBBACgC8AkhAQwBC0EAKALwCSIBIAY2AhwLQQBBAC8BlgoiA0EBajsBlgpBACgCqAogA0ECdGogATYCAAJAIAJBIkYNACACQSdGDQBBAEEAKAKwCkF+ajYCsAoPCyACEBpBAEEAKAKwCkECaiICNgKwCgJAAkACQEEBEClBV2oOBAECAgACC0EAQQAoArAKQQJqNgKwCkEBECkaQQAoAvAJIgMgAjYCBCADQQE6ABggA0EAKAKwCiICNgIQQQAgAkF+ajYCsAoPC0EAKALwCSIDIAI2AgQgA0EBOgAYQQBBAC8BmApBf2o7AZgKIANBACgCsApBAmo2AgxBAEEALwGWCkF/ajsBlgoPC0EAQQAoArAKQX5qNgKwCg8LAkAgBEEBcyACQfsAR3INAEEAKAKwCiECQQAvAZgKDQUDQAJAAkACQCACQQAoArQKTw0AQQEQKSICQSJGDQEgAkEnRg0BIAJB/QBHDQJBAEEAKAKwCkECajYCsAoLQQEQKSEDQQAoArAKIQICQCADQeYARw0AIAJBAmpBrAhBBhAvDQcLQQAgAkEIajYCsAoCQEEBECkiAkEiRg0AIAJBJ0cNBwsgACACQQAQKw8LIAIQGgtBAEEAKAKwCkECaiICNgKwCgwACwsCQAJAIAJBWWoOBAMBAQMACyACQSJGDQILQQAoArAKIQYLIAYgAUcNAEEAIABBCmo2ArAKDwsgAkEqRyAHcQ0DQQAvAZgKQf//A3ENA0EAKAKwCiECQQAoArQKIQEDQCACIAFPDQECQAJAIAIvAQAiA0EnRg0AIANBIkcNAQsgACADIAgQKw8LQQAgAkECaiICNgKwCgwACwsQJQsPC0EAIAJBfmo2ArAKDwtBAEEAKAKwCkF+ajYCsAoLRwEDf0EAKAKwCkECaiEAQQAoArQKIQECQANAIAAiAkF+aiABTw0BIAJBAmohACACLwEAQXZqDgQBAAABAAsLQQAgAjYCsAoLmAEBA39BAEEAKAKwCiIBQQJqNgKwCiABQQZqIQFBACgCtAohAgNAAkACQAJAIAFBfGogAk8NACABQX5qLwEAIQMCQAJAIAANACADQSpGDQEgA0F2ag4EAgQEAgQLIANBKkcNAwsgAS8BAEEvRw0CQQAgAUF+ajYCsAoMAQsgAUF+aiEBC0EAIAE2ArAKDwsgAUECaiEBDAALC4gBAQR/QQAoArAKIQFBACgCtAohAgJAAkADQCABIgNBAmohASADIAJPDQEgAS8BACIEIABGDQICQCAEQdwARg0AIARBdmoOBAIBAQIBCyADQQRqIQEgAy8BBEENRw0AIANBBmogASADLwEGQQpGGyEBDAALC0EAIAE2ArAKECUPC0EAIAE2ArAKC2wBAX8CQAJAIABBX2oiAUEFSw0AQQEgAXRBMXENAQsgAEFGakH//wNxQQZJDQAgAEEpRyAAQVhqQf//A3FBB0lxDQACQCAAQaV/ag4EAQAAAQALIABB/QBHIABBhX9qQf//A3FBBElxDwtBAQsuAQF/QQEhAQJAIABBpglBBRAdDQAgAEGWCEEDEB0NACAAQbAJQQIQHSEBCyABC0YBA39BACEDAkAgACACQQF0IgJrIgRBAmoiAEEAKALcCSIFSQ0AIAAgASACEC8NAAJAIAAgBUcNAEEBDwsgBBAmIQMLIAMLgwEBAn9BASEBAkACQAJAAkACQAJAIAAvAQAiAkFFag4EBQQEAQALAkAgAkGbf2oOBAMEBAIACyACQSlGDQQgAkH5AEcNAyAAQX5qQbwJQQYQHQ8LIABBfmovAQBBPUYPCyAAQX5qQbQJQQQQHQ8LIABBfmpByAlBAxAdDwtBACEBCyABC7QDAQJ/QQAhAQJAAkACQAJAAkACQAJAAkACQAJAIAAvAQBBnH9qDhQAAQIJCQkJAwkJBAUJCQYJBwkJCAkLAkACQCAAQX5qLwEAQZd/ag4EAAoKAQoLIABBfGpByghBAhAdDwsgAEF8akHOCEEDEB0PCwJAAkACQCAAQX5qLwEAQY1/ag4DAAECCgsCQCAAQXxqLwEAIgJB4QBGDQAgAkHsAEcNCiAAQXpqQeUAECcPCyAAQXpqQeMAECcPCyAAQXxqQdQIQQQQHQ8LIABBfGpB3AhBBhAdDwsgAEF+ai8BAEHvAEcNBiAAQXxqLwEAQeUARw0GAkAgAEF6ai8BACICQfAARg0AIAJB4wBHDQcgAEF4akHoCEEGEB0PCyAAQXhqQfQIQQIQHQ8LIABBfmpB+AhBBBAdDwtBASEBIABBfmoiAEHpABAnDQQgAEGACUEFEB0PCyAAQX5qQeQAECcPCyAAQX5qQYoJQQcQHQ8LIABBfmpBmAlBBBAdDwsCQCAAQX5qLwEAIgJB7wBGDQAgAkHlAEcNASAAQXxqQe4AECcPCyAAQXxqQaAJQQMQHSEBCyABCzQBAX9BASEBAkAgAEF3akH//wNxQQVJDQAgAEGAAXJBoAFGDQAgAEEuRyAAEChxIQELIAELMAEBfwJAAkAgAEF3aiIBQRdLDQBBASABdEGNgIAEcQ0BCyAAQaABRg0AQQAPC0EBC04BAn9BACEBAkACQCAALwEAIgJB5QBGDQAgAkHrAEcNASAAQX5qQfgIQQQQHQ8LIABBfmovAQBB9QBHDQAgAEF8akHcCEEGEB0hAQsgAQveAQEEf0EAKAKwCiEAQQAoArQKIQECQAJAAkADQCAAIgJBAmohACACIAFPDQECQAJAAkAgAC8BACIDQaR/ag4FAgMDAwEACyADQSRHDQIgAi8BBEH7AEcNAkEAIAJBBGoiADYCsApBAEEALwGYCiICQQFqOwGYCkEAKAKkCiACQQN0aiICQQQ2AgAgAiAANgIEDwtBACAANgKwCkEAQQAvAZgKQX9qIgA7AZgKQQAoAqQKIABB//8DcUEDdGooAgBBA0cNAwwECyACQQRqIQAMAAsLQQAgADYCsAoLECULC3ABAn8CQAJAA0BBAEEAKAKwCiIAQQJqIgE2ArAKIABBACgCtApPDQECQAJAAkAgAS8BACIBQaV/ag4CAQIACwJAIAFBdmoOBAQDAwQACyABQS9HDQIMBAsQLhoMAQtBACAAQQRqNgKwCgwACwsQJQsLNQEBf0EAQQE6APwJQQAoArAKIQBBAEEAKAK0CkECajYCsApBACAAQQAoAtwJa0EBdTYCkAoLQwECf0EBIQECQCAALwEAIgJBd2pB//8DcUEFSQ0AIAJBgAFyQaABRg0AQQAhASACEChFDQAgAkEuRyAAECpyDwsgAQs9AQJ/QQAhAgJAQQAoAtwJIgMgAEsNACAALwEAIAFHDQACQCADIABHDQBBAQ8LIABBfmovAQAQICECCyACC2gBAn9BASEBAkACQCAAQV9qIgJBBUsNAEEBIAJ0QTFxDQELIABB+P8DcUEoRg0AIABBRmpB//8DcUEGSQ0AAkAgAEGlf2oiAkEDSw0AIAJBAUcNAQsgAEGFf2pB//8DcUEESSEBCyABC5wBAQN/QQAoArAKIQECQANAAkACQCABLwEAIgJBL0cNAAJAIAEvAQIiAUEqRg0AIAFBL0cNBBAYDAILIAAQGQwBCwJAAkAgAEUNACACQXdqIgFBF0sNAUEBIAF0QZ+AgARxRQ0BDAILIAIQIUUNAwwBCyACQaABRw0CC0EAQQAoArAKIgNBAmoiATYCsAogA0EAKAK0CkkNAAsLIAILMQEBf0EAIQECQCAALwEAQS5HDQAgAEF+ai8BAEEuRw0AIABBfGovAQBBLkYhAQsgAQumBAEBfwJAIAFBIkYNACABQSdGDQAQJQ8LQQAoArAKIQMgARAaIAAgA0ECakEAKAKwCkEAKALQCRABAkAgAkEBSA0AQQAoAvAJQQRBBiACQQFGGzYCHAtBAEEAKAKwCkECajYCsAoCQAJAAkACQEEAECkiAUHhAEYNACABQfcARg0BQQAoArAKIQEMAgtBACgCsAoiAUECakHACEEKEC8NAUEGIQIMAgtBACgCsAoiAS8BAkHpAEcNACABLwEEQfQARw0AQQQhAiABLwEGQegARg0BC0EAIAFBfmo2ArAKDwtBACABIAJBAXRqNgKwCgJAQQEQKUH7AEYNAEEAIAE2ArAKDwtBACgCsAoiACECA0BBACACQQJqNgKwCgJAAkACQEEBECkiAkEiRg0AIAJBJ0cNAUEnEBpBAEEAKAKwCkECajYCsApBARApIQIMAgtBIhAaQQBBACgCsApBAmo2ArAKQQEQKSECDAELIAIQLCECCwJAIAJBOkYNAEEAIAE2ArAKDwtBAEEAKAKwCkECajYCsAoCQEEBECkiAkEiRg0AIAJBJ0YNAEEAIAE2ArAKDwsgAhAaQQBBACgCsApBAmo2ArAKAkACQEEBECkiAkEsRg0AIAJB/QBGDQFBACABNgKwCg8LQQBBACgCsApBAmo2ArAKQQEQKUH9AEYNAEEAKAKwCiECDAELC0EAKALwCSIBIAA2AhAgAUEAKAKwCkECajYCDAttAQJ/AkACQANAAkAgAEH//wNxIgFBd2oiAkEXSw0AQQEgAnRBn4CABHENAgsgAUGgAUYNASAAIQIgARAoDQJBACECQQBBACgCsAoiAEECajYCsAogAC8BAiIADQAMAgsLIAAhAgsgAkH//wNxC6sBAQR/AkACQEEAKAKwCiICLwEAIgNB4QBGDQAgASEEIAAhBQwBC0EAIAJBBGo2ArAKQQEQKSECQQAoArAKIQUCQAJAIAJBIkYNACACQSdGDQAgAhAsGkEAKAKwCiEEDAELIAIQGkEAQQAoArAKQQJqIgQ2ArAKC0EBECkhA0EAKAKwCiECCwJAIAIgBUYNACAFIARBACAAIAAgAUYiAhtBACABIAIbEAILIAMLcgEEf0EAKAKwCiEAQQAoArQKIQECQAJAA0AgAEECaiECIAAgAU8NAQJAAkAgAi8BACIDQaR/ag4CAQQACyACIQAgA0F2ag4EAgEBAgELIABBBGohAAwACwtBACACNgKwChAlQQAPC0EAIAI2ArAKQd0AC0kBA39BACEDAkAgAkUNAAJAA0AgAC0AACIEIAEtAAAiBUcNASABQQFqIQEgAEEBaiEAIAJBf2oiAg0ADAILCyAEIAVrIQMLIAMLC+wBAgBBgAgLzgEAAHgAcABvAHIAdABtAHAAbwByAHQAZgBvAHIAZQB0AGEAbwB1AHIAYwBlAHIAbwBtAHUAbgBjAHQAaQBvAG4AcwBzAGUAcgB0AHYAbwB5AGkAZQBkAGUAbABlAGMAbwBuAHQAaQBuAGkAbgBzAHQAYQBuAHQAeQBiAHIAZQBhAHIAZQB0AHUAcgBkAGUAYgB1AGcAZwBlAGEAdwBhAGkAdABoAHIAdwBoAGkAbABlAGkAZgBjAGEAdABjAGYAaQBuAGEAbABsAGUAbABzAABB0AkLEAEAAAACAAAAAAQAAEA5AAA=", "undefined" != typeof Buffer ? Buffer.from(A, "base64") : Uint8Array.from(atob(A), (A2) => A2.charCodeAt(0));
      var A;
    }, "E");
    WebAssembly.compile(E()).then(WebAssembly.instantiate).then(({ exports: A }) => {
    });
    DevalueError = class extends Error {
      static {
        __name(this, "DevalueError");
      }
      /**
       * @param {string} message
       * @param {string[]} keys
       */
      constructor(message, keys) {
        super(message);
        this.name = "DevalueError";
        this.path = keys.join("");
      }
    };
    __name(is_primitive, "is_primitive");
    object_proto_names = /* @__PURE__ */ Object.getOwnPropertyNames(
      Object.prototype
    ).sort().join("\0");
    __name(is_plain_object, "is_plain_object");
    __name(get_type, "get_type");
    __name(get_escaped_char, "get_escaped_char");
    __name(stringify_string, "stringify_string");
    __name(enumerable_symbols, "enumerable_symbols");
    is_identifier = /^[a-zA-Z_$][a-zA-Z_$0-9]*$/;
    __name(stringify_key, "stringify_key");
    __name(encode64, "encode64");
    __name(decode64, "decode64");
    KEY_STRING = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    __name(asciiToBinary, "asciiToBinary");
    __name(binaryToAscii, "binaryToAscii");
    UNDEFINED = -1;
    HOLE = -2;
    NAN = -3;
    POSITIVE_INFINITY = -4;
    NEGATIVE_INFINITY = -5;
    NEGATIVE_ZERO = -6;
    __name(parse, "parse");
    __name(unflatten, "unflatten");
    __name(stringify, "stringify");
    __name(stringify_primitive, "stringify_primitive");
    ACTION_QUERY_PARAMS$1 = {
      actionName: "_action"
    };
    ACTION_RPC_ROUTE_PATTERN = "/_actions/[...path]";
    __vite_import_meta_env__ = { "ASSETS_PREFIX": void 0, "BASE_URL": "/", "DEV": false, "MODE": "production", "PROD": true, "SITE": void 0, "SSR": true };
    ACTION_QUERY_PARAMS = ACTION_QUERY_PARAMS$1;
    codeToStatusMap = {
      // Implemented from IANA HTTP Status Code Registry
      // https://www.iana.org/assignments/http-status-codes/http-status-codes.xhtml
      BAD_REQUEST: 400,
      UNAUTHORIZED: 401,
      PAYMENT_REQUIRED: 402,
      FORBIDDEN: 403,
      NOT_FOUND: 404,
      METHOD_NOT_ALLOWED: 405,
      NOT_ACCEPTABLE: 406,
      PROXY_AUTHENTICATION_REQUIRED: 407,
      REQUEST_TIMEOUT: 408,
      CONFLICT: 409,
      GONE: 410,
      LENGTH_REQUIRED: 411,
      PRECONDITION_FAILED: 412,
      CONTENT_TOO_LARGE: 413,
      URI_TOO_LONG: 414,
      UNSUPPORTED_MEDIA_TYPE: 415,
      RANGE_NOT_SATISFIABLE: 416,
      EXPECTATION_FAILED: 417,
      MISDIRECTED_REQUEST: 421,
      UNPROCESSABLE_CONTENT: 422,
      LOCKED: 423,
      FAILED_DEPENDENCY: 424,
      TOO_EARLY: 425,
      UPGRADE_REQUIRED: 426,
      PRECONDITION_REQUIRED: 428,
      TOO_MANY_REQUESTS: 429,
      REQUEST_HEADER_FIELDS_TOO_LARGE: 431,
      UNAVAILABLE_FOR_LEGAL_REASONS: 451,
      INTERNAL_SERVER_ERROR: 500,
      NOT_IMPLEMENTED: 501,
      BAD_GATEWAY: 502,
      SERVICE_UNAVAILABLE: 503,
      GATEWAY_TIMEOUT: 504,
      HTTP_VERSION_NOT_SUPPORTED: 505,
      VARIANT_ALSO_NEGOTIATES: 506,
      INSUFFICIENT_STORAGE: 507,
      LOOP_DETECTED: 508,
      NETWORK_AUTHENTICATION_REQUIRED: 511
    };
    statusToCodeMap = Object.entries(codeToStatusMap).reduce(
      // reverse the key-value pairs
      (acc, [key, value]) => ({ ...acc, [value]: key }),
      {}
    );
    ActionError = class _ActionError extends Error {
      static {
        __name(this, "ActionError");
      }
      type = "AstroActionError";
      code = "INTERNAL_SERVER_ERROR";
      status = 500;
      constructor(params) {
        super(params.message);
        this.code = params.code;
        this.status = _ActionError.codeToStatus(params.code);
        if (params.stack) {
          this.stack = params.stack;
        }
      }
      static codeToStatus(code) {
        return codeToStatusMap[code];
      }
      static statusToCode(status) {
        return statusToCodeMap[status] ?? "INTERNAL_SERVER_ERROR";
      }
      static fromJson(body) {
        if (isInputError(body)) {
          return new ActionInputError(body.issues);
        }
        if (isActionError(body)) {
          return new _ActionError(body);
        }
        return new _ActionError({
          code: "INTERNAL_SERVER_ERROR"
        });
      }
    };
    __name(isActionError, "isActionError");
    __name(isInputError, "isInputError");
    ActionInputError = class extends ActionError {
      static {
        __name(this, "ActionInputError");
      }
      type = "AstroActionInputError";
      // We don't expose all ZodError properties.
      // Not all properties will serialize from server to client,
      // and we don't want to import the full ZodError object into the client.
      issues;
      fields;
      constructor(issues) {
        super({
          message: `Failed to validate: ${JSON.stringify(issues, null, 2)}`,
          code: "BAD_REQUEST"
        });
        this.issues = issues;
        this.fields = {};
        for (const issue of issues) {
          if (issue.path.length > 0) {
            const key = issue.path[0].toString();
            this.fields[key] ??= [];
            this.fields[key]?.push(issue.message);
          }
        }
      }
    };
    __name(getActionQueryString, "getActionQueryString");
    __name(serializeActionResult, "serializeActionResult");
    __name(deserializeActionResult, "deserializeActionResult");
    actionResultErrorStack = /* @__PURE__ */ (/* @__PURE__ */ __name(function actionResultErrorStackFn() {
      let errorStack;
      return {
        set(stack) {
          errorStack = stack;
        },
        get() {
          return errorStack;
        }
      };
    }, "actionResultErrorStackFn"))();
    dist = {};
    __name(requireDist, "requireDist");
    distExports = requireDist();
    __name(template, "template");
    DEFAULT_404_ROUTE = {
      component: DEFAULT_404_COMPONENT,
      generate: /* @__PURE__ */ __name(() => "", "generate"),
      params: [],
      pattern: /^\/404\/?$/,
      prerender: false,
      pathname: "/404",
      segments: [[{ content: "404", dynamic: false, spread: false }]],
      type: "page",
      route: "/404",
      fallbackRoutes: [],
      isIndex: false,
      origin: "internal"
    };
    __name(ensure404Route, "ensure404Route");
    __name(default404Page, "default404Page");
    default404Page.isAstroComponentFactory = true;
    default404Instance = {
      default: default404Page
    };
  }
});

// dist/_worker.js/chunks/index_BOXgeMNR.mjs
function hasContentType(contentType, expected) {
  const type = contentType.split(";")[0].toLowerCase();
  return expected.some((t) => type === t);
}
function appendForwardSlash(path) {
  return path.endsWith("/") ? path : path + "/";
}
function prependForwardSlash(path) {
  return path[0] === "/" ? path : "/" + path;
}
function collapseDuplicateTrailingSlashes(path, trailingSlash) {
  if (!path) {
    return path;
  }
  return path.replace(MANY_TRAILING_SLASHES, trailingSlash ? "/" : "") || "/";
}
function removeTrailingForwardSlash(path) {
  return path.endsWith("/") ? path.slice(0, path.length - 1) : path;
}
function removeLeadingForwardSlash(path) {
  return path.startsWith("/") ? path.substring(1) : path;
}
function trimSlashes(path) {
  return path.replace(/^\/|\/$/g, "");
}
function isString(path) {
  return typeof path === "string" || path instanceof String;
}
function isInternalPath(path) {
  return INTERNAL_PREFIXES.has(path.slice(0, 2)) && !JUST_SLASHES.test(path);
}
function joinPaths(...paths) {
  return paths.filter(isString).map((path, i) => {
    if (i === 0) {
      return removeTrailingForwardSlash(path);
    } else if (i === paths.length - 1) {
      return removeLeadingForwardSlash(path);
    } else {
      return trimSlashes(path);
    }
  }).join("/");
}
function slash(path) {
  return path.replace(/\\/g, "/");
}
function fileExtension(path) {
  const ext = path.split(".").pop();
  return ext !== path ? `.${ext}` : "";
}
function hasFileExtension(path) {
  return WITH_FILE_EXT.test(path);
}
function hasActionPayload(locals) {
  return "_actionPayload" in locals;
}
function createGetActionResult(locals) {
  return (actionFn) => {
    if (!hasActionPayload(locals) || actionFn.toString() !== getActionQueryString(locals._actionPayload.actionName)) {
      return void 0;
    }
    return deserializeActionResult(locals._actionPayload.actionResult);
  };
}
function createCallAction(context2) {
  return (baseAction, input) => {
    Reflect.set(context2, ACTION_API_CONTEXT_SYMBOL, true);
    const action = baseAction.bind(context2);
    return action(input);
  };
}
function shouldAppendForwardSlash(trailingSlash, buildFormat) {
  switch (trailingSlash) {
    case "always":
      return true;
    case "never":
      return false;
    case "ignore": {
      switch (buildFormat) {
        case "directory":
          return true;
        case "preserve":
        case "file":
          return false;
      }
    }
  }
}
function redirectIsExternal(redirect) {
  if (typeof redirect === "string") {
    return redirect.startsWith("http://") || redirect.startsWith("https://");
  } else {
    return redirect.destination.startsWith("http://") || redirect.destination.startsWith("https://");
  }
}
async function renderRedirect(renderContext) {
  const {
    request: { method },
    routeData
  } = renderContext;
  const { redirect, redirectRoute } = routeData;
  const status = redirectRoute && typeof redirect === "object" ? redirect.status : method === "GET" ? 301 : 308;
  const headers = { location: encodeURI(redirectRouteGenerate(renderContext)) };
  if (redirect && redirectIsExternal(redirect)) {
    if (typeof redirect === "string") {
      return Response.redirect(redirect, status);
    } else {
      return Response.redirect(redirect.destination, status);
    }
  }
  return new Response(null, { status, headers });
}
function redirectRouteGenerate(renderContext) {
  const {
    params,
    routeData: { redirect, redirectRoute }
  } = renderContext;
  if (typeof redirectRoute !== "undefined") {
    return redirectRoute?.generate(params) || redirectRoute?.pathname || "/";
  } else if (typeof redirect === "string") {
    if (redirectIsExternal(redirect)) {
      return redirect;
    } else {
      let target = redirect;
      for (const param of Object.keys(params)) {
        const paramValue = params[param];
        target = target.replace(`[${param}]`, paramValue).replace(`[...${param}]`, paramValue);
      }
      return target;
    }
  } else if (typeof redirect === "undefined") {
    return "/";
  }
  return redirect.destination;
}
function badRequest(reason) {
  return new Response(null, {
    status: 400,
    statusText: "Bad request: " + reason
  });
}
async function getRequestData(request) {
  switch (request.method) {
    case "GET": {
      const url = new URL(request.url);
      const params = url.searchParams;
      if (!params.has("s") || !params.has("e") || !params.has("p")) {
        return badRequest("Missing required query parameters.");
      }
      const rawSlots = params.get("s");
      try {
        return {
          componentExport: params.get("e"),
          encryptedProps: params.get("p"),
          slots: JSON.parse(rawSlots)
        };
      } catch {
        return badRequest("Invalid slots format.");
      }
    }
    case "POST": {
      try {
        const raw = await request.text();
        const data = JSON.parse(raw);
        return data;
      } catch {
        return badRequest("Request format is invalid.");
      }
    }
    default: {
      return new Response(null, { status: 405 });
    }
  }
}
function createEndpoint(manifest2) {
  const page9 = /* @__PURE__ */ __name(async (result) => {
    const params = result.params;
    if (!params.name) {
      return new Response(null, {
        status: 400,
        statusText: "Bad request"
      });
    }
    const componentId = params.name;
    const data = await getRequestData(result.request);
    if (data instanceof Response) {
      return data;
    }
    const imp = manifest2.serverIslandMap?.get(componentId);
    if (!imp) {
      return new Response(null, {
        status: 404,
        statusText: "Not found"
      });
    }
    const key = await manifest2.key;
    const encryptedProps = data.encryptedProps;
    const propString = encryptedProps === "" ? "{}" : await decryptString(key, encryptedProps);
    const props = JSON.parse(propString);
    const componentModule = await imp();
    let Component = componentModule[data.componentExport];
    const slots = {};
    for (const prop in data.slots) {
      slots[prop] = createSlotValueFromString(data.slots[prop]);
    }
    result.response.headers.set("X-Robots-Tag", "noindex");
    if (isAstroComponentFactory(Component)) {
      const ServerIsland = Component;
      Component = /* @__PURE__ */ __name(function(...args) {
        return ServerIsland.apply(this, args);
      }, "Component");
      Object.assign(Component, ServerIsland);
      Component.propagation = "self";
    }
    return renderTemplate`${renderComponent(result, "Component", Component, props, slots)}`;
  }, "page");
  page9.isAstroComponentFactory = true;
  const instance = {
    default: page9,
    partial: true
  };
  return instance;
}
function matchRoute(pathname, manifest2) {
  return manifest2.routes.find((route) => {
    return route.pattern.test(pathname) || route.fallbackRoutes.some((fallbackRoute) => fallbackRoute.pattern.test(pathname));
  });
}
function isRoute404(route) {
  return ROUTE404_RE.test(route);
}
function isRoute500(route) {
  return ROUTE500_RE.test(route);
}
function isRoute404or500(route) {
  return isRoute404(route.route) || isRoute500(route.route);
}
function isRouteServerIsland(route) {
  return route.component === SERVER_ISLAND_COMPONENT;
}
function isRequestServerIsland(request, base = "") {
  const url = new URL(request.url);
  const pathname = base === "/" ? url.pathname.slice(base.length) : url.pathname.slice(base.length + 1);
  return pathname.startsWith(SERVER_ISLAND_BASE_PREFIX);
}
function requestIs404Or500(request, base = "") {
  const url = new URL(request.url);
  const pathname = url.pathname.slice(base.length);
  return isRoute404(pathname) || isRoute500(pathname);
}
function isRouteExternalRedirect(route) {
  return !!(route.type === "redirect" && route.redirect && redirectIsExternal(route.redirect));
}
function requestHasLocale(locales) {
  return function(context2) {
    return pathHasLocale(context2.url.pathname, locales);
  };
}
function pathHasLocale(path, locales) {
  const segments = path.split("/");
  for (const segment of segments) {
    for (const locale of locales) {
      if (typeof locale === "string") {
        if (normalizeTheLocale(segment) === normalizeTheLocale(locale)) {
          return true;
        }
      } else if (segment === locale.path) {
        return true;
      }
    }
  }
  return false;
}
function getPathByLocale(locale, locales) {
  for (const loopLocale of locales) {
    if (typeof loopLocale === "string") {
      if (loopLocale === locale) {
        return loopLocale;
      }
    } else {
      for (const code of loopLocale.codes) {
        if (code === locale) {
          return loopLocale.path;
        }
      }
    }
  }
  throw new AstroError(i18nNoLocaleFoundInPath);
}
function normalizeTheLocale(locale) {
  return locale.replaceAll("_", "-").toLowerCase();
}
function getAllCodes(locales) {
  const result = [];
  for (const loopLocale of locales) {
    if (typeof loopLocale === "string") {
      result.push(loopLocale);
    } else {
      result.push(...loopLocale.codes);
    }
  }
  return result;
}
function redirectToDefaultLocale({
  trailingSlash,
  format,
  base,
  defaultLocale
}) {
  return function(context2, statusCode) {
    if (shouldAppendForwardSlash(trailingSlash, format)) {
      return context2.redirect(`${appendForwardSlash(joinPaths(base, defaultLocale))}`, statusCode);
    } else {
      return context2.redirect(`${joinPaths(base, defaultLocale)}`, statusCode);
    }
  };
}
function notFound({ base, locales, fallback }) {
  return function(context2, response) {
    if (response?.headers.get(REROUTE_DIRECTIVE_HEADER) === "no" && typeof fallback === "undefined") {
      return response;
    }
    const url = context2.url;
    const isRoot = url.pathname === base + "/" || url.pathname === base;
    if (!(isRoot || pathHasLocale(url.pathname, locales))) {
      if (response) {
        response.headers.set(REROUTE_DIRECTIVE_HEADER, "no");
        return new Response(response.body, {
          status: 404,
          headers: response.headers
        });
      } else {
        return new Response(null, {
          status: 404,
          headers: {
            [REROUTE_DIRECTIVE_HEADER]: "no"
          }
        });
      }
    }
    return void 0;
  };
}
function redirectToFallback({
  fallback,
  locales,
  defaultLocale,
  strategy,
  base,
  fallbackType
}) {
  return async function(context2, response) {
    if (response.status >= 300 && fallback) {
      const fallbackKeys = fallback ? Object.keys(fallback) : [];
      const segments = context2.url.pathname.split("/");
      const urlLocale = segments.find((segment) => {
        for (const locale of locales) {
          if (typeof locale === "string") {
            if (locale === segment) {
              return true;
            }
          } else if (locale.path === segment) {
            return true;
          }
        }
        return false;
      });
      if (urlLocale && fallbackKeys.includes(urlLocale)) {
        const fallbackLocale = fallback[urlLocale];
        const pathFallbackLocale = getPathByLocale(fallbackLocale, locales);
        let newPathname;
        if (pathFallbackLocale === defaultLocale && strategy === "pathname-prefix-other-locales") {
          if (context2.url.pathname.includes(`${base}`)) {
            newPathname = context2.url.pathname.replace(`/${urlLocale}`, ``);
          } else {
            newPathname = context2.url.pathname.replace(`/${urlLocale}`, `/`);
          }
        } else {
          newPathname = context2.url.pathname.replace(`/${urlLocale}`, `/${pathFallbackLocale}`);
        }
        if (fallbackType === "rewrite") {
          return await context2.rewrite(newPathname + context2.url.search);
        } else {
          return context2.redirect(newPathname + context2.url.search);
        }
      }
    }
    return response;
  };
}
function parseLocale(header) {
  if (header === "*") {
    return [{ locale: header, qualityValue: void 0 }];
  }
  const result = [];
  const localeValues = header.split(",").map((str) => str.trim());
  for (const localeValue of localeValues) {
    const split = localeValue.split(";").map((str) => str.trim());
    const localeName = split[0];
    const qualityValue = split[1];
    if (!split) {
      continue;
    }
    if (qualityValue && qualityValue.startsWith("q=")) {
      const qualityValueAsFloat = Number.parseFloat(qualityValue.slice("q=".length));
      if (Number.isNaN(qualityValueAsFloat) || qualityValueAsFloat > 1) {
        result.push({
          locale: localeName,
          qualityValue: void 0
        });
      } else {
        result.push({
          locale: localeName,
          qualityValue: qualityValueAsFloat
        });
      }
    } else {
      result.push({
        locale: localeName,
        qualityValue: void 0
      });
    }
  }
  return result;
}
function sortAndFilterLocales(browserLocaleList, locales) {
  const normalizedLocales = getAllCodes(locales).map(normalizeTheLocale);
  return browserLocaleList.filter((browserLocale) => {
    if (browserLocale.locale !== "*") {
      return normalizedLocales.includes(normalizeTheLocale(browserLocale.locale));
    }
    return true;
  }).sort((a, b) => {
    if (a.qualityValue && b.qualityValue) {
      return Math.sign(b.qualityValue - a.qualityValue);
    }
    return 0;
  });
}
function computePreferredLocale(request, locales) {
  const acceptHeader = request.headers.get("Accept-Language");
  let result = void 0;
  if (acceptHeader) {
    const browserLocaleList = sortAndFilterLocales(parseLocale(acceptHeader), locales);
    const firstResult = browserLocaleList.at(0);
    if (firstResult && firstResult.locale !== "*") {
      for (const currentLocale of locales) {
        if (typeof currentLocale === "string") {
          if (normalizeTheLocale(currentLocale) === normalizeTheLocale(firstResult.locale)) {
            result = currentLocale;
            break;
          }
        } else {
          for (const currentCode of currentLocale.codes) {
            if (normalizeTheLocale(currentCode) === normalizeTheLocale(firstResult.locale)) {
              result = currentCode;
              break;
            }
          }
        }
      }
    }
  }
  return result;
}
function computePreferredLocaleList(request, locales) {
  const acceptHeader = request.headers.get("Accept-Language");
  let result = [];
  if (acceptHeader) {
    const browserLocaleList = sortAndFilterLocales(parseLocale(acceptHeader), locales);
    if (browserLocaleList.length === 1 && browserLocaleList.at(0).locale === "*") {
      return getAllCodes(locales);
    } else if (browserLocaleList.length > 0) {
      for (const browserLocale of browserLocaleList) {
        for (const loopLocale of locales) {
          if (typeof loopLocale === "string") {
            if (normalizeTheLocale(loopLocale) === normalizeTheLocale(browserLocale.locale)) {
              result.push(loopLocale);
            }
          } else {
            for (const code of loopLocale.codes) {
              if (code === browserLocale.locale) {
                result.push(code);
              }
            }
          }
        }
      }
    }
  }
  return result;
}
function computeCurrentLocale(pathname, locales, defaultLocale) {
  for (const segment of pathname.split("/")) {
    for (const locale of locales) {
      if (typeof locale === "string") {
        if (!segment.includes(locale)) continue;
        if (normalizeTheLocale(locale) === normalizeTheLocale(segment)) {
          return locale;
        }
      } else {
        if (locale.path === segment) {
          return locale.codes.at(0);
        } else {
          for (const code of locale.codes) {
            if (normalizeTheLocale(code) === normalizeTheLocale(segment)) {
              return code;
            }
          }
        }
      }
    }
  }
  for (const locale of locales) {
    if (typeof locale === "string") {
      if (locale === defaultLocale) {
        return locale;
      }
    } else {
      if (locale.path === defaultLocale) {
        return locale.codes.at(0);
      }
    }
  }
}
function attachCookiesToResponse(response, cookies) {
  Reflect.set(response, astroCookiesSymbol, cookies);
}
function getCookiesFromResponse(response) {
  let cookies = Reflect.get(response, astroCookiesSymbol);
  if (cookies != null) {
    return cookies;
  } else {
    return void 0;
  }
}
function* getSetCookiesFromResponse(response) {
  const cookies = getCookiesFromResponse(response);
  if (!cookies) {
    return [];
  }
  for (const headerValue of AstroCookies.consume(cookies)) {
    yield headerValue;
  }
  return [];
}
function createRequest({
  url,
  headers,
  method = "GET",
  body = void 0,
  logger,
  isPrerendered = false,
  routePattern,
  init: init2
}) {
  const headersObj = isPrerendered ? void 0 : headers instanceof Headers ? headers : new Headers(
    // Filter out HTTP/2 pseudo-headers. These are internally-generated headers added to all HTTP/2 requests with trusted metadata about the request.
    // Examples include `:method`, `:scheme`, `:authority`, and `:path`.
    // They are always prefixed with a colon to distinguish them from other headers, and it is an error to add the to a Headers object manually.
    // See https://httpwg.org/specs/rfc7540.html#HttpRequest
    Object.entries(headers).filter(([name]) => !name.startsWith(":"))
  );
  if (typeof url === "string") url = new URL(url);
  if (isPrerendered) {
    url.search = "";
  }
  const request = new Request(url, {
    method,
    headers: headersObj,
    // body is made available only if the request is for a page that will be on-demand rendered
    body: isPrerendered ? null : body,
    ...init2
  });
  if (isPrerendered) {
    let _headers = request.headers;
    const { value, writable, ...headersDesc } = Object.getOwnPropertyDescriptor(request, "headers") || {};
    Object.defineProperty(request, "headers", {
      ...headersDesc,
      get() {
        logger.warn(
          null,
          `\`Astro.request.headers\` was used when rendering the route \`${routePattern}'\`. \`Astro.request.headers\` is not available on prerendered pages. If you need access to request headers, make sure that the page is server-rendered using \`export const prerender = false;\` or by setting \`output\` to \`"server"\` in your Astro config to make all your pages server-rendered by default.`
        );
        return _headers;
      },
      set(newHeaders) {
        _headers = newHeaders;
      }
    });
  }
  return request;
}
function findRouteToRewrite({
  payload,
  routes,
  request,
  trailingSlash,
  buildFormat,
  base,
  outDir
}) {
  let newUrl = void 0;
  if (payload instanceof URL) {
    newUrl = payload;
  } else if (payload instanceof Request) {
    newUrl = new URL(payload.url);
  } else {
    newUrl = new URL(payload, new URL(request.url).origin);
  }
  let pathname = newUrl.pathname;
  const shouldAppendSlash = shouldAppendForwardSlash(trailingSlash, buildFormat);
  if (base !== "/") {
    const isBasePathRequest = newUrl.pathname === base || newUrl.pathname === removeTrailingForwardSlash(base);
    if (isBasePathRequest) {
      pathname = shouldAppendSlash ? "/" : "";
    } else if (newUrl.pathname.startsWith(base)) {
      pathname = shouldAppendSlash ? appendForwardSlash(newUrl.pathname) : removeTrailingForwardSlash(newUrl.pathname);
      pathname = pathname.slice(base.length);
    }
  }
  if (!pathname.startsWith("/") && shouldAppendSlash && newUrl.pathname.endsWith("/")) {
    pathname = prependForwardSlash(pathname);
  }
  if (pathname === "/" && base !== "/" && !shouldAppendSlash) {
    pathname = "";
  }
  if (buildFormat === "file") {
    pathname = pathname.replace(/\.html$/, "");
  }
  if (base !== "/" && (pathname === "" || pathname === "/") && !shouldAppendSlash) {
    newUrl.pathname = removeTrailingForwardSlash(base);
  } else {
    newUrl.pathname = joinPaths(...[base, pathname].filter(Boolean));
  }
  const decodedPathname = decodeURI(pathname);
  let foundRoute;
  for (const route of routes) {
    if (route.pattern.test(decodedPathname)) {
      if (route.params && route.params.length !== 0 && route.distURL && route.distURL.length !== 0) {
        if (!route.distURL.find(
          (url) => url.href.replace(outDir.toString(), "").replace(/(?:\/index\.html|\.html)$/, "") == trimSlashes(decodedPathname)
        )) {
          continue;
        }
      }
      foundRoute = route;
      break;
    }
  }
  if (foundRoute) {
    return {
      routeData: foundRoute,
      newUrl,
      pathname: decodedPathname
    };
  } else {
    const custom404 = routes.find((route) => route.route === "/404");
    if (custom404) {
      return { routeData: custom404, newUrl, pathname };
    } else {
      return { routeData: DEFAULT_404_ROUTE, newUrl, pathname };
    }
  }
}
function copyRequest(newUrl, oldRequest, isPrerendered, logger, routePattern) {
  if (oldRequest.bodyUsed) {
    throw new AstroError(RewriteWithBodyUsed);
  }
  return createRequest({
    url: newUrl,
    method: oldRequest.method,
    body: oldRequest.body,
    isPrerendered,
    logger,
    headers: isPrerendered ? {} : oldRequest.headers,
    routePattern,
    init: {
      referrer: oldRequest.referrer,
      referrerPolicy: oldRequest.referrerPolicy,
      mode: oldRequest.mode,
      credentials: oldRequest.credentials,
      cache: oldRequest.cache,
      redirect: oldRequest.redirect,
      integrity: oldRequest.integrity,
      signal: oldRequest.signal,
      keepalive: oldRequest.keepalive,
      // https://fetch.spec.whatwg.org/#dom-request-duplex
      // @ts-expect-error It isn't part of the types, but undici accepts it and it allows to carry over the body to a new request
      duplex: "half"
    }
  });
}
function setOriginPathname(request, pathname, trailingSlash, buildFormat) {
  if (!pathname) {
    pathname = "/";
  }
  const shouldAppendSlash = shouldAppendForwardSlash(trailingSlash, buildFormat);
  let finalPathname;
  if (pathname === "/") {
    finalPathname = "/";
  } else if (shouldAppendSlash) {
    finalPathname = appendForwardSlash(pathname);
  } else {
    finalPathname = removeTrailingForwardSlash(pathname);
  }
  Reflect.set(request, originPathnameSymbol, encodeURIComponent(finalPathname));
}
function getOriginPathname(request) {
  const origin = Reflect.get(request, originPathnameSymbol);
  if (origin) {
    return decodeURIComponent(origin);
  }
  return new URL(request.url).pathname;
}
function validateGetStaticPathsParameter([key, value], route) {
  if (!VALID_PARAM_TYPES.includes(typeof value)) {
    throw new AstroError({
      ...GetStaticPathsInvalidRouteParam,
      message: GetStaticPathsInvalidRouteParam.message(key, value, typeof value),
      location: {
        file: route
      }
    });
  }
}
function validateDynamicRouteModule(mod, {
  ssr,
  route
}) {
  if ((!ssr || route.prerender) && !mod.getStaticPaths) {
    throw new AstroError({
      ...GetStaticPathsRequired,
      location: { file: route.component }
    });
  }
}
function validateGetStaticPathsResult(result, logger, route) {
  if (!Array.isArray(result)) {
    throw new AstroError({
      ...InvalidGetStaticPathsReturn,
      message: InvalidGetStaticPathsReturn.message(typeof result),
      location: {
        file: route.component
      }
    });
  }
  result.forEach((pathObject) => {
    if (typeof pathObject === "object" && Array.isArray(pathObject) || pathObject === null) {
      throw new AstroError({
        ...InvalidGetStaticPathsEntry,
        message: InvalidGetStaticPathsEntry.message(
          Array.isArray(pathObject) ? "array" : typeof pathObject
        )
      });
    }
    if (pathObject.params === void 0 || pathObject.params === null || pathObject.params && Object.keys(pathObject.params).length === 0) {
      throw new AstroError({
        ...GetStaticPathsExpectedParams,
        location: {
          file: route.component
        }
      });
    }
    for (const [key, val] of Object.entries(pathObject.params)) {
      if (!(typeof val === "undefined" || typeof val === "string" || typeof val === "number")) {
        logger.warn(
          "router",
          `getStaticPaths() returned an invalid path param: "${key}". A string, number or undefined value was expected, but got \`${JSON.stringify(
            val
          )}\`.`
        );
      }
      if (typeof val === "string" && val === "") {
        logger.warn(
          "router",
          `getStaticPaths() returned an invalid path param: "${key}". \`undefined\` expected for an optional param, but got empty string.`
        );
      }
    }
  });
}
function stringifyParams(params, route) {
  const validatedParams = Object.entries(params).reduce((acc, next) => {
    validateGetStaticPathsParameter(next, route.component);
    const [key, value] = next;
    if (value !== void 0) {
      acc[key] = typeof value === "string" ? trimSlashes(value) : value.toString();
    }
    return acc;
  }, {});
  return route.generate(validatedParams);
}
function generatePaginateFunction(routeMatch, base) {
  return /* @__PURE__ */ __name(function paginateUtility(data, args = {}) {
    let { pageSize: _pageSize, params: _params, props: _props } = args;
    const pageSize = _pageSize || 10;
    const paramName = "page";
    const additionalParams = _params || {};
    const additionalProps = _props || {};
    let includesFirstPageNumber;
    if (routeMatch.params.includes(`...${paramName}`)) {
      includesFirstPageNumber = false;
    } else if (routeMatch.params.includes(`${paramName}`)) {
      includesFirstPageNumber = true;
    } else {
      throw new AstroError({
        ...PageNumberParamNotFound,
        message: PageNumberParamNotFound.message(paramName)
      });
    }
    const lastPage = Math.max(1, Math.ceil(data.length / pageSize));
    const result = [...Array(lastPage).keys()].map((num) => {
      const pageNum = num + 1;
      const start = pageSize === Infinity ? 0 : (pageNum - 1) * pageSize;
      const end = Math.min(start + pageSize, data.length);
      const params = {
        ...additionalParams,
        [paramName]: includesFirstPageNumber || pageNum > 1 ? String(pageNum) : void 0
      };
      const current = addRouteBase(routeMatch.generate({ ...params }), base);
      const next = pageNum === lastPage ? void 0 : addRouteBase(routeMatch.generate({ ...params, page: String(pageNum + 1) }), base);
      const prev = pageNum === 1 ? void 0 : addRouteBase(
        routeMatch.generate({
          ...params,
          page: !includesFirstPageNumber && pageNum - 1 === 1 ? void 0 : String(pageNum - 1)
        }),
        base
      );
      const first = pageNum === 1 ? void 0 : addRouteBase(
        routeMatch.generate({
          ...params,
          page: includesFirstPageNumber ? "1" : void 0
        }),
        base
      );
      const last = pageNum === lastPage ? void 0 : addRouteBase(routeMatch.generate({ ...params, page: String(lastPage) }), base);
      return {
        params,
        props: {
          ...additionalProps,
          page: {
            data: data.slice(start, end),
            start,
            end: end - 1,
            size: pageSize,
            total: data.length,
            currentPage: pageNum,
            lastPage,
            url: { current, next, prev, first, last }
          }
        }
      };
    });
    return result;
  }, "paginateUtility");
}
function addRouteBase(route, base) {
  let routeWithBase = joinPaths(base, route);
  if (routeWithBase === "") routeWithBase = "/";
  return routeWithBase;
}
async function callGetStaticPaths({
  mod,
  route,
  routeCache,
  logger,
  ssr,
  base
}) {
  const cached = routeCache.get(route);
  if (!mod) {
    throw new Error("This is an error caused by Astro and not your code. Please file an issue.");
  }
  if (cached?.staticPaths) {
    return cached.staticPaths;
  }
  validateDynamicRouteModule(mod, { ssr, route });
  if (ssr && !route.prerender) {
    const entry = Object.assign([], { keyed: /* @__PURE__ */ new Map() });
    routeCache.set(route, { ...cached, staticPaths: entry });
    return entry;
  }
  let staticPaths = [];
  if (!mod.getStaticPaths) {
    throw new Error("Unexpected Error.");
  }
  staticPaths = await mod.getStaticPaths({
    // Q: Why the cast?
    // A: So users downstream can have nicer typings, we have to make some sacrifice in our internal typings, which necessitate a cast here
    paginate: generatePaginateFunction(route, base)
  });
  validateGetStaticPathsResult(staticPaths, logger, route);
  const keyedStaticPaths = staticPaths;
  keyedStaticPaths.keyed = /* @__PURE__ */ new Map();
  for (const sp of keyedStaticPaths) {
    const paramsKey = stringifyParams(sp.params, route);
    keyedStaticPaths.keyed.set(paramsKey, sp);
  }
  routeCache.set(route, { ...cached, staticPaths: keyedStaticPaths });
  return keyedStaticPaths;
}
function findPathItemByKey(staticPaths, params, route, logger) {
  const paramsKey = stringifyParams(params, route);
  const matchedStaticPath = staticPaths.keyed.get(paramsKey);
  if (matchedStaticPath) {
    return matchedStaticPath;
  }
  logger.debug("router", `findPathItemByKey() - Unexpected cache miss looking for ${paramsKey}`);
}
function routeIsRedirect(route) {
  return route?.type === "redirect";
}
function routeIsFallback(route) {
  return route?.type === "fallback";
}
async function getProps(opts) {
  const { logger, mod, routeData: route, routeCache, pathname, serverLike, base } = opts;
  if (!route || route.pathname) {
    return {};
  }
  if (routeIsRedirect(route) || routeIsFallback(route) || route.component === DEFAULT_404_COMPONENT) {
    return {};
  }
  const staticPaths = await callGetStaticPaths({
    mod,
    route,
    routeCache,
    logger,
    ssr: serverLike,
    base
  });
  const params = getParams(route, pathname);
  const matchedStaticPath = findPathItemByKey(staticPaths, params, route, logger);
  if (!matchedStaticPath && (serverLike ? route.prerender : true)) {
    throw new AstroError({
      ...NoMatchingStaticPathFound,
      message: NoMatchingStaticPathFound.message(pathname),
      hint: NoMatchingStaticPathFound.hint([route.component])
    });
  }
  if (mod) {
    validatePrerenderEndpointCollision(route, mod, params);
  }
  const props = matchedStaticPath?.props ? { ...matchedStaticPath.props } : {};
  return props;
}
function getParams(route, pathname) {
  if (!route.params.length) return {};
  const paramsMatch = route.pattern.exec(pathname) || route.fallbackRoutes.map((fallbackRoute) => fallbackRoute.pattern.exec(pathname)).find((x) => x);
  if (!paramsMatch) return {};
  const params = {};
  route.params.forEach((key, i) => {
    if (key.startsWith("...")) {
      params[key.slice(3)] = paramsMatch[i + 1] ? paramsMatch[i + 1] : void 0;
    } else {
      params[key] = paramsMatch[i + 1];
    }
  });
  return params;
}
function validatePrerenderEndpointCollision(route, mod, params) {
  if (route.type === "endpoint" && mod.getStaticPaths) {
    const lastSegment = route.segments[route.segments.length - 1];
    const paramValues = Object.values(params);
    const lastParam = paramValues[paramValues.length - 1];
    if (lastSegment.length === 1 && lastSegment[0].dynamic && lastParam === void 0) {
      throw new AstroError({
        ...PrerenderDynamicEndpointPathCollide,
        message: PrerenderDynamicEndpointPathCollide.message(route.route),
        hint: PrerenderDynamicEndpointPathCollide.hint(route.component),
        location: {
          file: route.component
        }
      });
    }
  }
}
function getFunctionExpression(slot) {
  if (!slot) return;
  const expressions = slot?.expressions?.filter((e) => isRenderInstruction(e) === false);
  if (expressions?.length !== 1) return;
  return expressions[0];
}
function getActionContext(context2) {
  const callerInfo = getCallerInfo(context2);
  const actionResultAlreadySet = Boolean(context2.locals._actionPayload);
  let action = void 0;
  if (callerInfo && context2.request.method === "POST" && !actionResultAlreadySet) {
    action = {
      calledFrom: callerInfo.from,
      name: callerInfo.name,
      handler: /* @__PURE__ */ __name(async () => {
        const pipeline = Reflect.get(context2, apiContextRoutesSymbol);
        const callerInfoName = shouldAppendForwardSlash(
          pipeline.manifest.trailingSlash,
          pipeline.manifest.buildFormat
        ) ? removeTrailingForwardSlash(callerInfo.name) : callerInfo.name;
        const baseAction = await pipeline.getAction(callerInfoName);
        let input;
        try {
          input = await parseRequestBody(context2.request);
        } catch (e) {
          if (e instanceof TypeError) {
            return { data: void 0, error: new ActionError({ code: "UNSUPPORTED_MEDIA_TYPE" }) };
          }
          throw e;
        }
        const omitKeys = ["props", "getActionResult", "callAction", "redirect"];
        const actionAPIContext = Object.create(
          Object.getPrototypeOf(context2),
          Object.fromEntries(
            Object.entries(Object.getOwnPropertyDescriptors(context2)).filter(
              ([key]) => !omitKeys.includes(key)
            )
          )
        );
        Reflect.set(actionAPIContext, ACTION_API_CONTEXT_SYMBOL, true);
        const handler = baseAction.bind(actionAPIContext);
        return handler(input);
      }, "handler")
    };
  }
  function setActionResult(actionName, actionResult) {
    context2.locals._actionPayload = {
      actionResult,
      actionName
    };
  }
  __name(setActionResult, "setActionResult");
  return {
    action,
    setActionResult,
    serializeActionResult,
    deserializeActionResult
  };
}
function getCallerInfo(ctx) {
  if (ctx.routePattern === ACTION_RPC_ROUTE_PATTERN) {
    return { from: "rpc", name: ctx.url.pathname.replace(/^.*\/_actions\//, "") };
  }
  const queryParam = ctx.url.searchParams.get(ACTION_QUERY_PARAMS.actionName);
  if (queryParam) {
    return { from: "form", name: queryParam };
  }
  return void 0;
}
async function parseRequestBody(request) {
  const contentType = request.headers.get("content-type");
  const contentLength = request.headers.get("Content-Length");
  if (!contentType) return void 0;
  if (hasContentType(contentType, formContentTypes)) {
    return await request.clone().formData();
  }
  if (hasContentType(contentType, ["application/json"])) {
    return contentLength === "0" ? void 0 : await request.clone().json();
  }
  throw new TypeError("Unsupported content type");
}
async function callMiddleware(onRequest2, apiContext, responseFunction) {
  let nextCalled = false;
  let responseFunctionPromise = void 0;
  const next = /* @__PURE__ */ __name(async (payload) => {
    nextCalled = true;
    responseFunctionPromise = responseFunction(apiContext, payload);
    return responseFunctionPromise;
  }, "next");
  let middlewarePromise = onRequest2(apiContext, next);
  return await Promise.resolve(middlewarePromise).then(async (value) => {
    if (nextCalled) {
      if (typeof value !== "undefined") {
        if (value instanceof Response === false) {
          throw new AstroError(MiddlewareNotAResponse);
        }
        return value;
      } else {
        if (responseFunctionPromise) {
          return responseFunctionPromise;
        } else {
          throw new AstroError(MiddlewareNotAResponse);
        }
      }
    } else if (typeof value === "undefined") {
      throw new AstroError(MiddlewareNoDataOrNextCalled);
    } else if (value instanceof Response === false) {
      throw new AstroError(MiddlewareNotAResponse);
    } else {
      return value;
    }
  });
}
function jsonParseTransform(key, value) {
  if (key === "__proto__" || key === "constructor" && value && typeof value === "object" && "prototype" in value) {
    warnKeyDropped(key);
    return;
  }
  return value;
}
function warnKeyDropped(key) {
  console.warn(`[destr] Dropping "${key}" key to prevent prototype pollution.`);
}
function destr(value, options = {}) {
  if (typeof value !== "string") {
    return value;
  }
  if (value[0] === '"' && value[value.length - 1] === '"' && value.indexOf("\\") === -1) {
    return value.slice(1, -1);
  }
  const _value = value.trim();
  if (_value.length <= 9) {
    switch (_value.toLowerCase()) {
      case "true": {
        return true;
      }
      case "false": {
        return false;
      }
      case "undefined": {
        return void 0;
      }
      case "null": {
        return null;
      }
      case "nan": {
        return Number.NaN;
      }
      case "infinity": {
        return Number.POSITIVE_INFINITY;
      }
      case "-infinity": {
        return Number.NEGATIVE_INFINITY;
      }
    }
  }
  if (!JsonSigRx.test(value)) {
    if (options.strict) {
      throw new SyntaxError("[destr] Invalid JSON");
    }
    return value;
  }
  try {
    if (suspectProtoRx.test(value) || suspectConstructorRx.test(value)) {
      if (options.strict) {
        throw new Error("[destr] Possible prototype pollution");
      }
      return JSON.parse(value, jsonParseTransform);
    }
    return JSON.parse(value);
  } catch (error4) {
    if (options.strict) {
      throw error4;
    }
    return value;
  }
}
function wrapToPromise(value) {
  if (!value || typeof value.then !== "function") {
    return Promise.resolve(value);
  }
  return value;
}
function asyncCall(function_, ...arguments_) {
  try {
    return wrapToPromise(function_(...arguments_));
  } catch (error4) {
    return Promise.reject(error4);
  }
}
function isPrimitive(value) {
  const type = typeof value;
  return value === null || type !== "object" && type !== "function";
}
function isPureObject(value) {
  const proto = Object.getPrototypeOf(value);
  return !proto || proto.isPrototypeOf(Object);
}
function stringify$1(value) {
  if (isPrimitive(value)) {
    return String(value);
  }
  if (isPureObject(value) || Array.isArray(value)) {
    return JSON.stringify(value);
  }
  if (typeof value.toJSON === "function") {
    return stringify$1(value.toJSON());
  }
  throw new Error("[unstorage] Cannot stringify value!");
}
function serializeRaw(value) {
  if (typeof value === "string") {
    return value;
  }
  return BASE64_PREFIX + base64Encode(value);
}
function deserializeRaw(value) {
  if (typeof value !== "string") {
    return value;
  }
  if (!value.startsWith(BASE64_PREFIX)) {
    return value;
  }
  return base64Decode(value.slice(BASE64_PREFIX.length));
}
function base64Decode(input) {
  if (globalThis.Buffer) {
    return Buffer.from(input, "base64");
  }
  return Uint8Array.from(
    globalThis.atob(input),
    (c) => c.codePointAt(0)
  );
}
function base64Encode(input) {
  if (globalThis.Buffer) {
    return Buffer.from(input).toString("base64");
  }
  return globalThis.btoa(String.fromCodePoint(...input));
}
function normalizeKey(key) {
  if (!key) {
    return "";
  }
  return key.split("?")[0]?.replace(/[/\\]/g, ":").replace(/:+/g, ":").replace(/^:|:$/g, "") || "";
}
function joinKeys(...keys) {
  return normalizeKey(keys.join(":"));
}
function normalizeBaseKey(base) {
  base = normalizeKey(base);
  return base ? base + ":" : "";
}
function filterKeyByDepth(key, depth) {
  if (depth === void 0) {
    return true;
  }
  let substrCount = 0;
  let index = key.indexOf(":");
  while (index > -1) {
    substrCount++;
    index = key.indexOf(":", index + 1);
  }
  return substrCount <= depth;
}
function filterKeyByBase(key, base) {
  if (base) {
    return key.startsWith(base) && key[key.length - 1] !== "$";
  }
  return key[key.length - 1] !== "$";
}
function defineDriver(factory) {
  return factory;
}
function createStorage(options = {}) {
  const context2 = {
    mounts: { "": options.driver || memory() },
    mountpoints: [""],
    watching: false,
    watchListeners: [],
    unwatch: {}
  };
  const getMount = /* @__PURE__ */ __name((key) => {
    for (const base of context2.mountpoints) {
      if (key.startsWith(base)) {
        return {
          base,
          relativeKey: key.slice(base.length),
          driver: context2.mounts[base]
        };
      }
    }
    return {
      base: "",
      relativeKey: key,
      driver: context2.mounts[""]
    };
  }, "getMount");
  const getMounts = /* @__PURE__ */ __name((base, includeParent) => {
    return context2.mountpoints.filter(
      (mountpoint) => mountpoint.startsWith(base) || includeParent && base.startsWith(mountpoint)
    ).map((mountpoint) => ({
      relativeBase: base.length > mountpoint.length ? base.slice(mountpoint.length) : void 0,
      mountpoint,
      driver: context2.mounts[mountpoint]
    }));
  }, "getMounts");
  const onChange = /* @__PURE__ */ __name((event, key) => {
    if (!context2.watching) {
      return;
    }
    key = normalizeKey(key);
    for (const listener of context2.watchListeners) {
      listener(event, key);
    }
  }, "onChange");
  const startWatch = /* @__PURE__ */ __name(async () => {
    if (context2.watching) {
      return;
    }
    context2.watching = true;
    for (const mountpoint in context2.mounts) {
      context2.unwatch[mountpoint] = await watch(
        context2.mounts[mountpoint],
        onChange,
        mountpoint
      );
    }
  }, "startWatch");
  const stopWatch = /* @__PURE__ */ __name(async () => {
    if (!context2.watching) {
      return;
    }
    for (const mountpoint in context2.unwatch) {
      await context2.unwatch[mountpoint]();
    }
    context2.unwatch = {};
    context2.watching = false;
  }, "stopWatch");
  const runBatch = /* @__PURE__ */ __name((items, commonOptions, cb) => {
    const batches = /* @__PURE__ */ new Map();
    const getBatch = /* @__PURE__ */ __name((mount) => {
      let batch = batches.get(mount.base);
      if (!batch) {
        batch = {
          driver: mount.driver,
          base: mount.base,
          items: []
        };
        batches.set(mount.base, batch);
      }
      return batch;
    }, "getBatch");
    for (const item of items) {
      const isStringItem = typeof item === "string";
      const key = normalizeKey(isStringItem ? item : item.key);
      const value = isStringItem ? void 0 : item.value;
      const options2 = isStringItem || !item.options ? commonOptions : { ...commonOptions, ...item.options };
      const mount = getMount(key);
      getBatch(mount).items.push({
        key,
        value,
        relativeKey: mount.relativeKey,
        options: options2
      });
    }
    return Promise.all([...batches.values()].map((batch) => cb(batch))).then(
      (r2) => r2.flat()
    );
  }, "runBatch");
  const storage = {
    // Item
    hasItem(key, opts = {}) {
      key = normalizeKey(key);
      const { relativeKey, driver } = getMount(key);
      return asyncCall(driver.hasItem, relativeKey, opts);
    },
    getItem(key, opts = {}) {
      key = normalizeKey(key);
      const { relativeKey, driver } = getMount(key);
      return asyncCall(driver.getItem, relativeKey, opts).then(
        (value) => destr(value)
      );
    },
    getItems(items, commonOptions = {}) {
      return runBatch(items, commonOptions, (batch) => {
        if (batch.driver.getItems) {
          return asyncCall(
            batch.driver.getItems,
            batch.items.map((item) => ({
              key: item.relativeKey,
              options: item.options
            })),
            commonOptions
          ).then(
            (r2) => r2.map((item) => ({
              key: joinKeys(batch.base, item.key),
              value: destr(item.value)
            }))
          );
        }
        return Promise.all(
          batch.items.map((item) => {
            return asyncCall(
              batch.driver.getItem,
              item.relativeKey,
              item.options
            ).then((value) => ({
              key: item.key,
              value: destr(value)
            }));
          })
        );
      });
    },
    getItemRaw(key, opts = {}) {
      key = normalizeKey(key);
      const { relativeKey, driver } = getMount(key);
      if (driver.getItemRaw) {
        return asyncCall(driver.getItemRaw, relativeKey, opts);
      }
      return asyncCall(driver.getItem, relativeKey, opts).then(
        (value) => deserializeRaw(value)
      );
    },
    async setItem(key, value, opts = {}) {
      if (value === void 0) {
        return storage.removeItem(key);
      }
      key = normalizeKey(key);
      const { relativeKey, driver } = getMount(key);
      if (!driver.setItem) {
        return;
      }
      await asyncCall(driver.setItem, relativeKey, stringify$1(value), opts);
      if (!driver.watch) {
        onChange("update", key);
      }
    },
    async setItems(items, commonOptions) {
      await runBatch(items, commonOptions, async (batch) => {
        if (batch.driver.setItems) {
          return asyncCall(
            batch.driver.setItems,
            batch.items.map((item) => ({
              key: item.relativeKey,
              value: stringify$1(item.value),
              options: item.options
            })),
            commonOptions
          );
        }
        if (!batch.driver.setItem) {
          return;
        }
        await Promise.all(
          batch.items.map((item) => {
            return asyncCall(
              batch.driver.setItem,
              item.relativeKey,
              stringify$1(item.value),
              item.options
            );
          })
        );
      });
    },
    async setItemRaw(key, value, opts = {}) {
      if (value === void 0) {
        return storage.removeItem(key, opts);
      }
      key = normalizeKey(key);
      const { relativeKey, driver } = getMount(key);
      if (driver.setItemRaw) {
        await asyncCall(driver.setItemRaw, relativeKey, value, opts);
      } else if (driver.setItem) {
        await asyncCall(driver.setItem, relativeKey, serializeRaw(value), opts);
      } else {
        return;
      }
      if (!driver.watch) {
        onChange("update", key);
      }
    },
    async removeItem(key, opts = {}) {
      if (typeof opts === "boolean") {
        opts = { removeMeta: opts };
      }
      key = normalizeKey(key);
      const { relativeKey, driver } = getMount(key);
      if (!driver.removeItem) {
        return;
      }
      await asyncCall(driver.removeItem, relativeKey, opts);
      if (opts.removeMeta || opts.removeMata) {
        await asyncCall(driver.removeItem, relativeKey + "$", opts);
      }
      if (!driver.watch) {
        onChange("remove", key);
      }
    },
    // Meta
    async getMeta(key, opts = {}) {
      if (typeof opts === "boolean") {
        opts = { nativeOnly: opts };
      }
      key = normalizeKey(key);
      const { relativeKey, driver } = getMount(key);
      const meta = /* @__PURE__ */ Object.create(null);
      if (driver.getMeta) {
        Object.assign(meta, await asyncCall(driver.getMeta, relativeKey, opts));
      }
      if (!opts.nativeOnly) {
        const value = await asyncCall(
          driver.getItem,
          relativeKey + "$",
          opts
        ).then((value_) => destr(value_));
        if (value && typeof value === "object") {
          if (typeof value.atime === "string") {
            value.atime = new Date(value.atime);
          }
          if (typeof value.mtime === "string") {
            value.mtime = new Date(value.mtime);
          }
          Object.assign(meta, value);
        }
      }
      return meta;
    },
    setMeta(key, value, opts = {}) {
      return this.setItem(key + "$", value, opts);
    },
    removeMeta(key, opts = {}) {
      return this.removeItem(key + "$", opts);
    },
    // Keys
    async getKeys(base, opts = {}) {
      base = normalizeBaseKey(base);
      const mounts = getMounts(base, true);
      let maskedMounts = [];
      const allKeys = [];
      let allMountsSupportMaxDepth = true;
      for (const mount of mounts) {
        if (!mount.driver.flags?.maxDepth) {
          allMountsSupportMaxDepth = false;
        }
        const rawKeys = await asyncCall(
          mount.driver.getKeys,
          mount.relativeBase,
          opts
        );
        for (const key of rawKeys) {
          const fullKey = mount.mountpoint + normalizeKey(key);
          if (!maskedMounts.some((p) => fullKey.startsWith(p))) {
            allKeys.push(fullKey);
          }
        }
        maskedMounts = [
          mount.mountpoint,
          ...maskedMounts.filter((p) => !p.startsWith(mount.mountpoint))
        ];
      }
      const shouldFilterByDepth = opts.maxDepth !== void 0 && !allMountsSupportMaxDepth;
      return allKeys.filter(
        (key) => (!shouldFilterByDepth || filterKeyByDepth(key, opts.maxDepth)) && filterKeyByBase(key, base)
      );
    },
    // Utils
    async clear(base, opts = {}) {
      base = normalizeBaseKey(base);
      await Promise.all(
        getMounts(base, false).map(async (m) => {
          if (m.driver.clear) {
            return asyncCall(m.driver.clear, m.relativeBase, opts);
          }
          if (m.driver.removeItem) {
            const keys = await m.driver.getKeys(m.relativeBase || "", opts);
            return Promise.all(
              keys.map((key) => m.driver.removeItem(key, opts))
            );
          }
        })
      );
    },
    async dispose() {
      await Promise.all(
        Object.values(context2.mounts).map((driver) => dispose(driver))
      );
    },
    async watch(callback) {
      await startWatch();
      context2.watchListeners.push(callback);
      return async () => {
        context2.watchListeners = context2.watchListeners.filter(
          (listener) => listener !== callback
        );
        if (context2.watchListeners.length === 0) {
          await stopWatch();
        }
      };
    },
    async unwatch() {
      context2.watchListeners = [];
      await stopWatch();
    },
    // Mount
    mount(base, driver) {
      base = normalizeBaseKey(base);
      if (base && context2.mounts[base]) {
        throw new Error(`already mounted at ${base}`);
      }
      if (base) {
        context2.mountpoints.push(base);
        context2.mountpoints.sort((a, b) => b.length - a.length);
      }
      context2.mounts[base] = driver;
      if (context2.watching) {
        Promise.resolve(watch(driver, onChange, base)).then((unwatcher) => {
          context2.unwatch[base] = unwatcher;
        }).catch(console.error);
      }
      return storage;
    },
    async unmount(base, _dispose = true) {
      base = normalizeBaseKey(base);
      if (!base || !context2.mounts[base]) {
        return;
      }
      if (context2.watching && base in context2.unwatch) {
        context2.unwatch[base]?.();
        delete context2.unwatch[base];
      }
      if (_dispose) {
        await dispose(context2.mounts[base]);
      }
      context2.mountpoints = context2.mountpoints.filter((key) => key !== base);
      delete context2.mounts[base];
    },
    getMount(key = "") {
      key = normalizeKey(key) + ":";
      const m = getMount(key);
      return {
        driver: m.driver,
        base: m.base
      };
    },
    getMounts(base = "", opts = {}) {
      base = normalizeKey(base);
      const mounts = getMounts(base, opts.parents);
      return mounts.map((m) => ({
        driver: m.driver,
        base: m.mountpoint
      }));
    },
    // Aliases
    keys: /* @__PURE__ */ __name((base, opts = {}) => storage.getKeys(base, opts), "keys"),
    get: /* @__PURE__ */ __name((key, opts = {}) => storage.getItem(key, opts), "get"),
    set: /* @__PURE__ */ __name((key, value, opts = {}) => storage.setItem(key, value, opts), "set"),
    has: /* @__PURE__ */ __name((key, opts = {}) => storage.hasItem(key, opts), "has"),
    del: /* @__PURE__ */ __name((key, opts = {}) => storage.removeItem(key, opts), "del"),
    remove: /* @__PURE__ */ __name((key, opts = {}) => storage.removeItem(key, opts), "remove")
  };
  return storage;
}
function watch(driver, onChange, base) {
  return driver.watch ? driver.watch((event, key) => onChange(event, base + key)) : () => {
  };
}
async function dispose(driver) {
  if (typeof driver.dispose === "function") {
    await asyncCall(driver.dispose);
  }
}
function resolveSessionDriverName(driver) {
  if (!driver) {
    return null;
  }
  try {
    if (driver === "fs") {
      return builtinDrivers.fsLite;
    }
    if (driver in builtinDrivers) {
      return builtinDrivers[driver];
    }
  } catch {
    return null;
  }
  return driver;
}
function sequence(...handlers) {
  const filtered = handlers.filter((h) => !!h);
  const length = filtered.length;
  if (!length) {
    return defineMiddleware((_context, next) => {
      return next();
    });
  }
  return defineMiddleware((context2, next) => {
    let carriedPayload = void 0;
    return applyHandle(0, context2);
    function applyHandle(i, handleContext) {
      const handle2 = filtered[i];
      const result = handle2(handleContext, async (payload) => {
        if (i < length - 1) {
          if (payload) {
            let newRequest;
            if (payload instanceof Request) {
              newRequest = payload;
            } else if (payload instanceof URL) {
              newRequest = new Request(payload, handleContext.request.clone());
            } else {
              newRequest = new Request(
                new URL(payload, handleContext.url.origin),
                handleContext.request.clone()
              );
            }
            const oldPathname = handleContext.url.pathname;
            const pipeline = Reflect.get(handleContext, apiContextRoutesSymbol);
            const { routeData, pathname } = await pipeline.tryRewrite(
              payload,
              handleContext.request
            );
            if (pipeline.serverLike === true && handleContext.isPrerendered === false && routeData.prerender === true) {
              throw new AstroError({
                ...ForbiddenRewrite,
                message: ForbiddenRewrite.message(
                  handleContext.url.pathname,
                  pathname,
                  routeData.component
                ),
                hint: ForbiddenRewrite.hint(routeData.component)
              });
            }
            carriedPayload = payload;
            handleContext.request = newRequest;
            handleContext.url = new URL(newRequest.url);
            handleContext.cookies = new AstroCookies(newRequest);
            handleContext.params = getParams(routeData, pathname);
            handleContext.routePattern = routeData.route;
            setOriginPathname(
              handleContext.request,
              oldPathname,
              pipeline.manifest.trailingSlash,
              pipeline.manifest.buildFormat
            );
          }
          return applyHandle(i + 1, handleContext);
        } else {
          return next(payload ?? carriedPayload);
        }
      });
      return result;
    }
    __name(applyHandle, "applyHandle");
  });
}
function defineMiddleware(fn) {
  return fn;
}
var ACTION_API_CONTEXT_SYMBOL, formContentTypes, MANY_TRAILING_SLASHES, INTERNAL_PREFIXES, JUST_SLASHES, WITH_FILE_EXT, SERVER_ISLAND_ROUTE, SERVER_ISLAND_COMPONENT, SERVER_ISLAND_BASE_PREFIX, ROUTE404_RE, ROUTE500_RE, DELETED_EXPIRATION, DELETED_VALUE, responseSentSymbol2, identity, AstroCookie, AstroCookies, astroCookiesSymbol, VALID_PARAM_TYPES, RouteCache, Slots, suspectProtoRx, suspectConstructorRx, JsonSigRx, BASE64_PREFIX, DRIVER_NAME, memory, builtinDrivers, PERSIST_SYMBOL, DEFAULT_COOKIE_NAME, VALID_COOKIE_REGEX, unflatten2, stringify2, AstroSession, apiContextRoutesSymbol, RenderContext;
var init_index_BOXgeMNR = __esm({
  "dist/_worker.js/chunks/index_BOXgeMNR.mjs"() {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_astro_designed_error_pages_zET6Ym84();
    init_server_BRKsKzpO();
    globalThis.process ??= {};
    globalThis.process.env ??= {};
    ACTION_API_CONTEXT_SYMBOL = Symbol.for("astro.actionAPIContext");
    formContentTypes = ["application/x-www-form-urlencoded", "multipart/form-data"];
    __name(hasContentType, "hasContentType");
    __name(appendForwardSlash, "appendForwardSlash");
    __name(prependForwardSlash, "prependForwardSlash");
    MANY_TRAILING_SLASHES = /\/{2,}$/g;
    __name(collapseDuplicateTrailingSlashes, "collapseDuplicateTrailingSlashes");
    __name(removeTrailingForwardSlash, "removeTrailingForwardSlash");
    __name(removeLeadingForwardSlash, "removeLeadingForwardSlash");
    __name(trimSlashes, "trimSlashes");
    __name(isString, "isString");
    INTERNAL_PREFIXES = /* @__PURE__ */ new Set(["/_", "/@", "/.", "//"]);
    JUST_SLASHES = /^\/{2,}$/;
    __name(isInternalPath, "isInternalPath");
    __name(joinPaths, "joinPaths");
    __name(slash, "slash");
    __name(fileExtension, "fileExtension");
    WITH_FILE_EXT = /\/[^/]+\.\w+$/;
    __name(hasFileExtension, "hasFileExtension");
    __name(hasActionPayload, "hasActionPayload");
    __name(createGetActionResult, "createGetActionResult");
    __name(createCallAction, "createCallAction");
    __name(shouldAppendForwardSlash, "shouldAppendForwardSlash");
    __name(redirectIsExternal, "redirectIsExternal");
    __name(renderRedirect, "renderRedirect");
    __name(redirectRouteGenerate, "redirectRouteGenerate");
    SERVER_ISLAND_ROUTE = "/_server-islands/[name]";
    SERVER_ISLAND_COMPONENT = "_server-islands.astro";
    SERVER_ISLAND_BASE_PREFIX = "_server-islands";
    __name(badRequest, "badRequest");
    __name(getRequestData, "getRequestData");
    __name(createEndpoint, "createEndpoint");
    __name(matchRoute, "matchRoute");
    ROUTE404_RE = /^\/404\/?$/;
    ROUTE500_RE = /^\/500\/?$/;
    __name(isRoute404, "isRoute404");
    __name(isRoute500, "isRoute500");
    __name(isRoute404or500, "isRoute404or500");
    __name(isRouteServerIsland, "isRouteServerIsland");
    __name(isRequestServerIsland, "isRequestServerIsland");
    __name(requestIs404Or500, "requestIs404Or500");
    __name(isRouteExternalRedirect, "isRouteExternalRedirect");
    __name(requestHasLocale, "requestHasLocale");
    __name(pathHasLocale, "pathHasLocale");
    __name(getPathByLocale, "getPathByLocale");
    __name(normalizeTheLocale, "normalizeTheLocale");
    __name(getAllCodes, "getAllCodes");
    __name(redirectToDefaultLocale, "redirectToDefaultLocale");
    __name(notFound, "notFound");
    __name(redirectToFallback, "redirectToFallback");
    __name(parseLocale, "parseLocale");
    __name(sortAndFilterLocales, "sortAndFilterLocales");
    __name(computePreferredLocale, "computePreferredLocale");
    __name(computePreferredLocaleList, "computePreferredLocaleList");
    __name(computeCurrentLocale, "computeCurrentLocale");
    DELETED_EXPIRATION = /* @__PURE__ */ new Date(0);
    DELETED_VALUE = "deleted";
    responseSentSymbol2 = Symbol.for("astro.responseSent");
    identity = /* @__PURE__ */ __name((value) => value, "identity");
    AstroCookie = class {
      static {
        __name(this, "AstroCookie");
      }
      constructor(value) {
        this.value = value;
      }
      json() {
        if (this.value === void 0) {
          throw new Error(`Cannot convert undefined to an object.`);
        }
        return JSON.parse(this.value);
      }
      number() {
        return Number(this.value);
      }
      boolean() {
        if (this.value === "false") return false;
        if (this.value === "0") return false;
        return Boolean(this.value);
      }
    };
    AstroCookies = class {
      static {
        __name(this, "AstroCookies");
      }
      #request;
      #requestValues;
      #outgoing;
      #consumed;
      constructor(request) {
        this.#request = request;
        this.#requestValues = null;
        this.#outgoing = null;
        this.#consumed = false;
      }
      /**
       * Astro.cookies.delete(key) is used to delete a cookie. Using this method will result
       * in a Set-Cookie header added to the response.
       * @param key The cookie to delete
       * @param options Options related to this deletion, such as the path of the cookie.
       */
      delete(key, options) {
        const {
          // @ts-expect-error
          maxAge: _ignoredMaxAge,
          // @ts-expect-error
          expires: _ignoredExpires,
          ...sanitizedOptions
        } = options || {};
        const serializeOptions = {
          expires: DELETED_EXPIRATION,
          ...sanitizedOptions
        };
        this.#ensureOutgoingMap().set(key, [
          DELETED_VALUE,
          distExports.serialize(key, DELETED_VALUE, serializeOptions),
          false
        ]);
      }
      /**
       * Astro.cookies.get(key) is used to get a cookie value. The cookie value is read from the
       * request. If you have set a cookie via Astro.cookies.set(key, value), the value will be taken
       * from that set call, overriding any values already part of the request.
       * @param key The cookie to get.
       * @returns An object containing the cookie value as well as convenience methods for converting its value.
       */
      get(key, options = void 0) {
        if (this.#outgoing?.has(key)) {
          let [serializedValue, , isSetValue] = this.#outgoing.get(key);
          if (isSetValue) {
            return new AstroCookie(serializedValue);
          } else {
            return void 0;
          }
        }
        const decode = options?.decode ?? decodeURIComponent;
        const values = this.#ensureParsed();
        if (key in values) {
          const value = values[key];
          if (value) {
            return new AstroCookie(decode(value));
          }
        }
      }
      /**
       * Astro.cookies.has(key) returns a boolean indicating whether this cookie is either
       * part of the initial request or set via Astro.cookies.set(key)
       * @param key The cookie to check for.
       * @param _options This parameter is no longer used.
       * @returns
       */
      has(key, _options) {
        if (this.#outgoing?.has(key)) {
          let [, , isSetValue] = this.#outgoing.get(key);
          return isSetValue;
        }
        const values = this.#ensureParsed();
        return values[key] !== void 0;
      }
      /**
       * Astro.cookies.set(key, value) is used to set a cookie's value. If provided
       * an object it will be stringified via JSON.stringify(value). Additionally you
       * can provide options customizing how this cookie will be set, such as setting httpOnly
       * in order to prevent the cookie from being read in client-side JavaScript.
       * @param key The name of the cookie to set.
       * @param value A value, either a string or other primitive or an object.
       * @param options Options for the cookie, such as the path and security settings.
       */
      set(key, value, options) {
        if (this.#consumed) {
          const warning = new Error(
            "Astro.cookies.set() was called after the cookies had already been sent to the browser.\nThis may have happened if this method was called in an imported component.\nPlease make sure that Astro.cookies.set() is only called in the frontmatter of the main page."
          );
          warning.name = "Warning";
          console.warn(warning);
        }
        let serializedValue;
        if (typeof value === "string") {
          serializedValue = value;
        } else {
          let toStringValue = value.toString();
          if (toStringValue === Object.prototype.toString.call(value)) {
            serializedValue = JSON.stringify(value);
          } else {
            serializedValue = toStringValue;
          }
        }
        const serializeOptions = {};
        if (options) {
          Object.assign(serializeOptions, options);
        }
        this.#ensureOutgoingMap().set(key, [
          serializedValue,
          distExports.serialize(key, serializedValue, serializeOptions),
          true
        ]);
        if (this.#request[responseSentSymbol2]) {
          throw new AstroError({
            ...ResponseSentError
          });
        }
      }
      /**
       * Merges a new AstroCookies instance into the current instance. Any new cookies
       * will be added to the current instance, overwriting any existing cookies with the same name.
       */
      merge(cookies) {
        const outgoing = cookies.#outgoing;
        if (outgoing) {
          for (const [key, value] of outgoing) {
            this.#ensureOutgoingMap().set(key, value);
          }
        }
      }
      /**
       * Astro.cookies.header() returns an iterator for the cookies that have previously
       * been set by either Astro.cookies.set() or Astro.cookies.delete().
       * This method is primarily used by adapters to set the header on outgoing responses.
       * @returns
       */
      *headers() {
        if (this.#outgoing == null) return;
        for (const [, value] of this.#outgoing) {
          yield value[1];
        }
      }
      /**
       * Behaves the same as AstroCookies.prototype.headers(),
       * but allows a warning when cookies are set after the instance is consumed.
       */
      static consume(cookies) {
        cookies.#consumed = true;
        return cookies.headers();
      }
      #ensureParsed() {
        if (!this.#requestValues) {
          this.#parse();
        }
        if (!this.#requestValues) {
          this.#requestValues = {};
        }
        return this.#requestValues;
      }
      #ensureOutgoingMap() {
        if (!this.#outgoing) {
          this.#outgoing = /* @__PURE__ */ new Map();
        }
        return this.#outgoing;
      }
      #parse() {
        const raw = this.#request.headers.get("cookie");
        if (!raw) {
          return;
        }
        this.#requestValues = distExports.parse(raw, { decode: identity });
      }
    };
    astroCookiesSymbol = Symbol.for("astro.cookies");
    __name(attachCookiesToResponse, "attachCookiesToResponse");
    __name(getCookiesFromResponse, "getCookiesFromResponse");
    __name(getSetCookiesFromResponse, "getSetCookiesFromResponse");
    __name(createRequest, "createRequest");
    __name(findRouteToRewrite, "findRouteToRewrite");
    __name(copyRequest, "copyRequest");
    __name(setOriginPathname, "setOriginPathname");
    __name(getOriginPathname, "getOriginPathname");
    VALID_PARAM_TYPES = ["string", "number", "undefined"];
    __name(validateGetStaticPathsParameter, "validateGetStaticPathsParameter");
    __name(validateDynamicRouteModule, "validateDynamicRouteModule");
    __name(validateGetStaticPathsResult, "validateGetStaticPathsResult");
    __name(stringifyParams, "stringifyParams");
    __name(generatePaginateFunction, "generatePaginateFunction");
    __name(addRouteBase, "addRouteBase");
    __name(callGetStaticPaths, "callGetStaticPaths");
    RouteCache = class {
      static {
        __name(this, "RouteCache");
      }
      logger;
      cache = {};
      runtimeMode;
      constructor(logger, runtimeMode = "production") {
        this.logger = logger;
        this.runtimeMode = runtimeMode;
      }
      /** Clear the cache. */
      clearAll() {
        this.cache = {};
      }
      set(route, entry) {
        const key = this.key(route);
        if (this.runtimeMode === "production" && this.cache[key]?.staticPaths) {
          this.logger.warn(null, `Internal Warning: route cache overwritten. (${key})`);
        }
        this.cache[key] = entry;
      }
      get(route) {
        return this.cache[this.key(route)];
      }
      key(route) {
        return `${route.route}_${route.component}`;
      }
    };
    __name(findPathItemByKey, "findPathItemByKey");
    __name(routeIsRedirect, "routeIsRedirect");
    __name(routeIsFallback, "routeIsFallback");
    __name(getProps, "getProps");
    __name(getParams, "getParams");
    __name(validatePrerenderEndpointCollision, "validatePrerenderEndpointCollision");
    __name(getFunctionExpression, "getFunctionExpression");
    Slots = class {
      static {
        __name(this, "Slots");
      }
      #result;
      #slots;
      #logger;
      constructor(result, slots, logger) {
        this.#result = result;
        this.#slots = slots;
        this.#logger = logger;
        if (slots) {
          for (const key of Object.keys(slots)) {
            if (this[key] !== void 0) {
              throw new AstroError({
                ...ReservedSlotName,
                message: ReservedSlotName.message(key)
              });
            }
            Object.defineProperty(this, key, {
              get() {
                return true;
              },
              enumerable: true
            });
          }
        }
      }
      has(name) {
        if (!this.#slots) return false;
        return Boolean(this.#slots[name]);
      }
      async render(name, args = []) {
        if (!this.#slots || !this.has(name)) return;
        const result = this.#result;
        if (!Array.isArray(args)) {
          this.#logger.warn(
            null,
            `Expected second parameter to be an array, received a ${typeof args}. If you're trying to pass an array as a single argument and getting unexpected results, make sure you're passing your array as a item of an array. Ex: Astro.slots.render('default', [["Hello", "World"]])`
          );
        } else if (args.length > 0) {
          const slotValue = this.#slots[name];
          const component = typeof slotValue === "function" ? await slotValue(result) : await slotValue;
          const expression = getFunctionExpression(component);
          if (expression) {
            const slot = /* @__PURE__ */ __name(async () => typeof expression === "function" ? expression(...args) : expression, "slot");
            return await renderSlotToString(result, slot).then((res) => {
              return res;
            });
          }
          if (typeof component === "function") {
            return await renderJSX(result, component(...args)).then(
              (res) => res != null ? String(res) : res
            );
          }
        }
        const content = await renderSlotToString(result, this.#slots[name]);
        const outHTML = chunkToString(result, content);
        return outHTML;
      }
    };
    __name(getActionContext, "getActionContext");
    __name(getCallerInfo, "getCallerInfo");
    __name(parseRequestBody, "parseRequestBody");
    __name(callMiddleware, "callMiddleware");
    suspectProtoRx = /"(?:_|\\u0{2}5[Ff]){2}(?:p|\\u0{2}70)(?:r|\\u0{2}72)(?:o|\\u0{2}6[Ff])(?:t|\\u0{2}74)(?:o|\\u0{2}6[Ff])(?:_|\\u0{2}5[Ff]){2}"\s*:/;
    suspectConstructorRx = /"(?:c|\\u0063)(?:o|\\u006[Ff])(?:n|\\u006[Ee])(?:s|\\u0073)(?:t|\\u0074)(?:r|\\u0072)(?:u|\\u0075)(?:c|\\u0063)(?:t|\\u0074)(?:o|\\u006[Ff])(?:r|\\u0072)"\s*:/;
    JsonSigRx = /^\s*["[{]|^\s*-?\d{1,16}(\.\d{1,17})?([Ee][+-]?\d+)?\s*$/;
    __name(jsonParseTransform, "jsonParseTransform");
    __name(warnKeyDropped, "warnKeyDropped");
    __name(destr, "destr");
    __name(wrapToPromise, "wrapToPromise");
    __name(asyncCall, "asyncCall");
    __name(isPrimitive, "isPrimitive");
    __name(isPureObject, "isPureObject");
    __name(stringify$1, "stringify$1");
    BASE64_PREFIX = "base64:";
    __name(serializeRaw, "serializeRaw");
    __name(deserializeRaw, "deserializeRaw");
    __name(base64Decode, "base64Decode");
    __name(base64Encode, "base64Encode");
    __name(normalizeKey, "normalizeKey");
    __name(joinKeys, "joinKeys");
    __name(normalizeBaseKey, "normalizeBaseKey");
    __name(filterKeyByDepth, "filterKeyByDepth");
    __name(filterKeyByBase, "filterKeyByBase");
    __name(defineDriver, "defineDriver");
    DRIVER_NAME = "memory";
    memory = defineDriver(() => {
      const data = /* @__PURE__ */ new Map();
      return {
        name: DRIVER_NAME,
        getInstance: /* @__PURE__ */ __name(() => data, "getInstance"),
        hasItem(key) {
          return data.has(key);
        },
        getItem(key) {
          return data.get(key) ?? null;
        },
        getItemRaw(key) {
          return data.get(key) ?? null;
        },
        setItem(key, value) {
          data.set(key, value);
        },
        setItemRaw(key, value) {
          data.set(key, value);
        },
        removeItem(key) {
          data.delete(key);
        },
        getKeys() {
          return [...data.keys()];
        },
        clear() {
          data.clear();
        },
        dispose() {
          data.clear();
        }
      };
    });
    __name(createStorage, "createStorage");
    __name(watch, "watch");
    __name(dispose, "dispose");
    builtinDrivers = {
      "azure-app-configuration": "unstorage/drivers/azure-app-configuration",
      "azureAppConfiguration": "unstorage/drivers/azure-app-configuration",
      "azure-cosmos": "unstorage/drivers/azure-cosmos",
      "azureCosmos": "unstorage/drivers/azure-cosmos",
      "azure-key-vault": "unstorage/drivers/azure-key-vault",
      "azureKeyVault": "unstorage/drivers/azure-key-vault",
      "azure-storage-blob": "unstorage/drivers/azure-storage-blob",
      "azureStorageBlob": "unstorage/drivers/azure-storage-blob",
      "azure-storage-table": "unstorage/drivers/azure-storage-table",
      "azureStorageTable": "unstorage/drivers/azure-storage-table",
      "capacitor-preferences": "unstorage/drivers/capacitor-preferences",
      "capacitorPreferences": "unstorage/drivers/capacitor-preferences",
      "cloudflare-kv-binding": "unstorage/drivers/cloudflare-kv-binding",
      "cloudflareKVBinding": "unstorage/drivers/cloudflare-kv-binding",
      "cloudflare-kv-http": "unstorage/drivers/cloudflare-kv-http",
      "cloudflareKVHttp": "unstorage/drivers/cloudflare-kv-http",
      "cloudflare-r2-binding": "unstorage/drivers/cloudflare-r2-binding",
      "cloudflareR2Binding": "unstorage/drivers/cloudflare-r2-binding",
      "db0": "unstorage/drivers/db0",
      "deno-kv-node": "unstorage/drivers/deno-kv-node",
      "denoKVNode": "unstorage/drivers/deno-kv-node",
      "deno-kv": "unstorage/drivers/deno-kv",
      "denoKV": "unstorage/drivers/deno-kv",
      "fs-lite": "unstorage/drivers/fs-lite",
      "fsLite": "unstorage/drivers/fs-lite",
      "fs": "unstorage/drivers/fs",
      "github": "unstorage/drivers/github",
      "http": "unstorage/drivers/http",
      "indexedb": "unstorage/drivers/indexedb",
      "localstorage": "unstorage/drivers/localstorage",
      "lru-cache": "unstorage/drivers/lru-cache",
      "lruCache": "unstorage/drivers/lru-cache",
      "memory": "unstorage/drivers/memory",
      "mongodb": "unstorage/drivers/mongodb",
      "netlify-blobs": "unstorage/drivers/netlify-blobs",
      "netlifyBlobs": "unstorage/drivers/netlify-blobs",
      "null": "unstorage/drivers/null",
      "overlay": "unstorage/drivers/overlay",
      "planetscale": "unstorage/drivers/planetscale",
      "redis": "unstorage/drivers/redis",
      "s3": "unstorage/drivers/s3",
      "session-storage": "unstorage/drivers/session-storage",
      "sessionStorage": "unstorage/drivers/session-storage",
      "uploadthing": "unstorage/drivers/uploadthing",
      "upstash": "unstorage/drivers/upstash",
      "vercel-blob": "unstorage/drivers/vercel-blob",
      "vercelBlob": "unstorage/drivers/vercel-blob",
      "vercel-kv": "unstorage/drivers/vercel-kv",
      "vercelKV": "unstorage/drivers/vercel-kv"
    };
    PERSIST_SYMBOL = Symbol();
    DEFAULT_COOKIE_NAME = "astro-session";
    VALID_COOKIE_REGEX = /^[\w-]+$/;
    unflatten2 = /* @__PURE__ */ __name((parsed, _) => {
      return unflatten(parsed, {
        URL: /* @__PURE__ */ __name((href) => new URL(href), "URL")
      });
    }, "unflatten");
    stringify2 = /* @__PURE__ */ __name((data, _) => {
      return stringify(data, {
        // Support URL objects
        URL: /* @__PURE__ */ __name((val) => val instanceof URL && val.href, "URL")
      });
    }, "stringify");
    AstroSession = class _AstroSession {
      static {
        __name(this, "AstroSession");
      }
      // The cookies object.
      #cookies;
      // The session configuration.
      #config;
      // The cookie config
      #cookieConfig;
      // The cookie name
      #cookieName;
      // The unstorage object for the session driver.
      #storage;
      #data;
      // The session ID. A v4 UUID.
      #sessionID;
      // Sessions to destroy. Needed because we won't have the old session ID after it's destroyed locally.
      #toDestroy = /* @__PURE__ */ new Set();
      // Session keys to delete. Used for partial data sets to avoid overwriting the deleted value.
      #toDelete = /* @__PURE__ */ new Set();
      // Whether the session is dirty and needs to be saved.
      #dirty = false;
      // Whether the session cookie has been set.
      #cookieSet = false;
      // The local data is "partial" if it has not been loaded from storage yet and only
      // contains values that have been set or deleted in-memory locally.
      // We do this to avoid the need to block on loading data when it is only being set.
      // When we load the data from storage, we need to merge it with the local partial data,
      // preserving in-memory changes and deletions.
      #partial = true;
      static #sharedStorage = /* @__PURE__ */ new Map();
      constructor(cookies, {
        cookie: cookieConfig = DEFAULT_COOKIE_NAME,
        ...config2
      }, runtimeMode) {
        const { driver } = config2;
        if (!driver) {
          throw new AstroError({
            ...SessionStorageInitError,
            message: SessionStorageInitError.message(
              "No driver was defined in the session configuration and the adapter did not provide a default driver."
            )
          });
        }
        this.#cookies = cookies;
        let cookieConfigObject;
        if (typeof cookieConfig === "object") {
          const { name = DEFAULT_COOKIE_NAME, ...rest } = cookieConfig;
          this.#cookieName = name;
          cookieConfigObject = rest;
        } else {
          this.#cookieName = cookieConfig || DEFAULT_COOKIE_NAME;
        }
        this.#cookieConfig = {
          sameSite: "lax",
          secure: runtimeMode === "production",
          path: "/",
          ...cookieConfigObject,
          httpOnly: true
        };
        this.#config = { ...config2, driver };
      }
      /**
       * Gets a session value. Returns `undefined` if the session or value does not exist.
       */
      async get(key) {
        return (await this.#ensureData()).get(key)?.data;
      }
      /**
       * Checks if a session value exists.
       */
      async has(key) {
        return (await this.#ensureData()).has(key);
      }
      /**
       * Gets all session values.
       */
      async keys() {
        return (await this.#ensureData()).keys();
      }
      /**
       * Gets all session values.
       */
      async values() {
        return [...(await this.#ensureData()).values()].map((entry) => entry.data);
      }
      /**
       * Gets all session entries.
       */
      async entries() {
        return [...(await this.#ensureData()).entries()].map(([key, entry]) => [key, entry.data]);
      }
      /**
       * Deletes a session value.
       */
      delete(key) {
        this.#data?.delete(key);
        if (this.#partial) {
          this.#toDelete.add(key);
        }
        this.#dirty = true;
      }
      /**
       * Sets a session value. The session is created if it does not exist.
       */
      set(key, value, { ttl } = {}) {
        if (!key) {
          throw new AstroError({
            ...SessionStorageSaveError,
            message: "The session key was not provided."
          });
        }
        let cloned;
        try {
          cloned = unflatten2(JSON.parse(stringify2(value)));
        } catch (err) {
          throw new AstroError(
            {
              ...SessionStorageSaveError,
              message: `The session data for ${key} could not be serialized.`,
              hint: "See the devalue library for all supported types: https://github.com/rich-harris/devalue"
            },
            { cause: err }
          );
        }
        if (!this.#cookieSet) {
          this.#setCookie();
          this.#cookieSet = true;
        }
        this.#data ??= /* @__PURE__ */ new Map();
        const lifetime = ttl ?? this.#config.ttl;
        const expires = typeof lifetime === "number" ? Date.now() + lifetime * 1e3 : lifetime;
        this.#data.set(key, {
          data: cloned,
          expires
        });
        this.#dirty = true;
      }
      /**
       * Destroys the session, clearing the cookie and storage if it exists.
       */
      destroy() {
        const sessionId = this.#sessionID ?? this.#cookies.get(this.#cookieName)?.value;
        if (sessionId) {
          this.#toDestroy.add(sessionId);
        }
        this.#cookies.delete(this.#cookieName, this.#cookieConfig);
        this.#sessionID = void 0;
        this.#data = void 0;
        this.#dirty = true;
      }
      /**
       * Regenerates the session, creating a new session ID. The existing session data is preserved.
       */
      async regenerate() {
        let data = /* @__PURE__ */ new Map();
        try {
          data = await this.#ensureData();
        } catch (err) {
          console.error("Failed to load session data during regeneration:", err);
        }
        const oldSessionId = this.#sessionID;
        this.#sessionID = crypto.randomUUID();
        this.#data = data;
        await this.#setCookie();
        if (oldSessionId && this.#storage) {
          this.#storage.removeItem(oldSessionId).catch((err) => {
            console.error("Failed to remove old session data:", err);
          });
        }
      }
      // Persists the session data to storage.
      // This is called automatically at the end of the request.
      // Uses a symbol to prevent users from calling it directly.
      async [PERSIST_SYMBOL]() {
        if (!this.#dirty && !this.#toDestroy.size) {
          return;
        }
        const storage = await this.#ensureStorage();
        if (this.#dirty && this.#data) {
          const data = await this.#ensureData();
          this.#toDelete.forEach((key2) => data.delete(key2));
          const key = this.#ensureSessionID();
          let serialized;
          try {
            serialized = stringify2(data);
          } catch (err) {
            throw new AstroError(
              {
                ...SessionStorageSaveError,
                message: SessionStorageSaveError.message(
                  "The session data could not be serialized.",
                  this.#config.driver
                )
              },
              { cause: err }
            );
          }
          await storage.setItem(key, serialized);
          this.#dirty = false;
        }
        if (this.#toDestroy.size > 0) {
          const cleanupPromises = [...this.#toDestroy].map(
            (sessionId) => storage.removeItem(sessionId).catch((err) => {
              console.error(`Failed to clean up session ${sessionId}:`, err);
            })
          );
          await Promise.all(cleanupPromises);
          this.#toDestroy.clear();
        }
      }
      get sessionID() {
        return this.#sessionID;
      }
      /**
       * Loads a session from storage with the given ID, and replaces the current session.
       * Any changes made to the current session will be lost.
       * This is not normally needed, as the session is automatically loaded using the cookie.
       * However it can be used to restore a session where the ID has been recorded somewhere
       * else (e.g. in a database).
       */
      async load(sessionID) {
        this.#sessionID = sessionID;
        this.#data = void 0;
        await this.#setCookie();
        await this.#ensureData();
      }
      /**
       * Sets the session cookie.
       */
      async #setCookie() {
        if (!VALID_COOKIE_REGEX.test(this.#cookieName)) {
          throw new AstroError({
            ...SessionStorageSaveError,
            message: "Invalid cookie name. Cookie names can only contain letters, numbers, and dashes."
          });
        }
        const value = this.#ensureSessionID();
        this.#cookies.set(this.#cookieName, value, this.#cookieConfig);
      }
      /**
       * Attempts to load the session data from storage, or creates a new data object if none exists.
       * If there is existing partial data, it will be merged into the new data object.
       */
      async #ensureData() {
        const storage = await this.#ensureStorage();
        if (this.#data && !this.#partial) {
          return this.#data;
        }
        this.#data ??= /* @__PURE__ */ new Map();
        const raw = await storage.get(this.#ensureSessionID());
        if (!raw) {
          return this.#data;
        }
        try {
          const storedMap = unflatten2(raw);
          if (!(storedMap instanceof Map)) {
            await this.destroy();
            throw new AstroError({
              ...SessionStorageInitError,
              message: SessionStorageInitError.message(
                "The session data was an invalid type.",
                this.#config.driver
              )
            });
          }
          const now = Date.now();
          for (const [key, value] of storedMap) {
            const expired = typeof value.expires === "number" && value.expires < now;
            if (!this.#data.has(key) && !this.#toDelete.has(key) && !expired) {
              this.#data.set(key, value);
            }
          }
          this.#partial = false;
          return this.#data;
        } catch (err) {
          await this.destroy();
          if (err instanceof AstroError) {
            throw err;
          }
          throw new AstroError(
            {
              ...SessionStorageInitError,
              message: SessionStorageInitError.message(
                "The session data could not be parsed.",
                this.#config.driver
              )
            },
            { cause: err }
          );
        }
      }
      /**
       * Returns the session ID, generating a new one if it does not exist.
       */
      #ensureSessionID() {
        this.#sessionID ??= this.#cookies.get(this.#cookieName)?.value ?? crypto.randomUUID();
        return this.#sessionID;
      }
      /**
       * Ensures the storage is initialized.
       * This is called automatically when a storage operation is needed.
       */
      async #ensureStorage() {
        if (this.#storage) {
          return this.#storage;
        }
        if (_AstroSession.#sharedStorage.has(this.#config.driver)) {
          this.#storage = _AstroSession.#sharedStorage.get(this.#config.driver);
          return this.#storage;
        }
        if (this.#config.driver === "test") {
          this.#storage = this.#config.options.mockStorage;
          return this.#storage;
        }
        if (this.#config.driver === "fs" || this.#config.driver === "fsLite" || this.#config.driver === "fs-lite") {
          this.#config.options ??= {};
          this.#config.driver = "fs-lite";
          this.#config.options.base ??= ".astro/session";
        }
        let driver = null;
        try {
          if (this.#config.driverModule) {
            driver = (await this.#config.driverModule()).default;
          } else if (this.#config.driver) {
            const driverName = resolveSessionDriverName(this.#config.driver);
            if (driverName) {
              driver = (await import(driverName)).default;
            }
          }
        } catch (err) {
          if (err.code === "ERR_MODULE_NOT_FOUND") {
            throw new AstroError(
              {
                ...SessionStorageInitError,
                message: SessionStorageInitError.message(
                  err.message.includes(`Cannot find package`) ? "The driver module could not be found." : err.message,
                  this.#config.driver
                )
              },
              { cause: err }
            );
          }
          throw err;
        }
        if (!driver) {
          throw new AstroError({
            ...SessionStorageInitError,
            message: SessionStorageInitError.message(
              "The module did not export a driver.",
              this.#config.driver
            )
          });
        }
        try {
          this.#storage = createStorage({
            driver: driver(this.#config.options)
          });
          _AstroSession.#sharedStorage.set(this.#config.driver, this.#storage);
          return this.#storage;
        } catch (err) {
          throw new AstroError(
            {
              ...SessionStorageInitError,
              message: SessionStorageInitError.message("Unknown error", this.#config.driver)
            },
            { cause: err }
          );
        }
      }
    };
    __name(resolveSessionDriverName, "resolveSessionDriverName");
    apiContextRoutesSymbol = Symbol.for("context.routes");
    RenderContext = class _RenderContext {
      static {
        __name(this, "RenderContext");
      }
      constructor(pipeline, locals, middleware, actions, pathname, request, routeData, status, clientAddress, cookies = new AstroCookies(request), params = getParams(routeData, pathname), url = new URL(request.url), props = {}, partial = void 0, session = pipeline.manifest.sessionConfig ? new AstroSession(cookies, pipeline.manifest.sessionConfig, pipeline.runtimeMode) : void 0) {
        this.pipeline = pipeline;
        this.locals = locals;
        this.middleware = middleware;
        this.actions = actions;
        this.pathname = pathname;
        this.request = request;
        this.routeData = routeData;
        this.status = status;
        this.clientAddress = clientAddress;
        this.cookies = cookies;
        this.params = params;
        this.url = url;
        this.props = props;
        this.partial = partial;
        this.session = session;
      }
      /**
       * A flag that tells the render content if the rewriting was triggered
       */
      isRewriting = false;
      /**
       * A safety net in case of loops
       */
      counter = 0;
      result = void 0;
      static async create({
        locals = {},
        middleware,
        pathname,
        pipeline,
        request,
        routeData,
        clientAddress,
        status = 200,
        props,
        partial = void 0,
        actions
      }) {
        const pipelineMiddleware = await pipeline.getMiddleware();
        const pipelineActions = actions ?? await pipeline.getActions();
        setOriginPathname(
          request,
          pathname,
          pipeline.manifest.trailingSlash,
          pipeline.manifest.buildFormat
        );
        return new _RenderContext(
          pipeline,
          locals,
          sequence(...pipeline.internalMiddleware, middleware ?? pipelineMiddleware),
          pipelineActions,
          pathname,
          request,
          routeData,
          status,
          clientAddress,
          void 0,
          void 0,
          void 0,
          props,
          partial
        );
      }
      /**
       * The main function of the RenderContext.
       *
       * Use this function to render any route known to Astro.
       * It attempts to render a route. A route can be a:
       *
       * - page
       * - redirect
       * - endpoint
       * - fallback
       */
      async render(componentInstance, slots = {}) {
        const { cookies, middleware, pipeline } = this;
        const { logger, serverLike, streaming, manifest: manifest2 } = pipeline;
        const props = Object.keys(this.props).length > 0 ? this.props : await getProps({
          mod: componentInstance,
          routeData: this.routeData,
          routeCache: this.pipeline.routeCache,
          pathname: this.pathname,
          logger,
          serverLike,
          base: manifest2.base
        });
        const actionApiContext = this.createActionAPIContext();
        const apiContext = this.createAPIContext(props, actionApiContext);
        this.counter++;
        if (this.counter === 4) {
          return new Response("Loop Detected", {
            // https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/508
            status: 508,
            statusText: "Astro detected a loop where you tried to call the rewriting logic more than four times."
          });
        }
        const lastNext = /* @__PURE__ */ __name(async (ctx, payload) => {
          if (payload) {
            const oldPathname = this.pathname;
            pipeline.logger.debug("router", "Called rewriting to:", payload);
            const {
              routeData,
              componentInstance: newComponent,
              pathname,
              newUrl
            } = await pipeline.tryRewrite(payload, this.request);
            if (this.pipeline.serverLike === true && this.routeData.prerender === false && routeData.prerender === true) {
              throw new AstroError({
                ...ForbiddenRewrite,
                message: ForbiddenRewrite.message(this.pathname, pathname, routeData.component),
                hint: ForbiddenRewrite.hint(routeData.component)
              });
            }
            this.routeData = routeData;
            componentInstance = newComponent;
            if (payload instanceof Request) {
              this.request = payload;
            } else {
              this.request = copyRequest(
                newUrl,
                this.request,
                // need to send the flag of the previous routeData
                routeData.prerender,
                this.pipeline.logger,
                this.routeData.route
              );
            }
            this.isRewriting = true;
            this.url = new URL(this.request.url);
            this.params = getParams(routeData, pathname);
            this.pathname = pathname;
            this.status = 200;
            setOriginPathname(
              this.request,
              oldPathname,
              this.pipeline.manifest.trailingSlash,
              this.pipeline.manifest.buildFormat
            );
          }
          let response2;
          if (!ctx.isPrerendered) {
            const { action, setActionResult, serializeActionResult: serializeActionResult2 } = getActionContext(ctx);
            if (action?.calledFrom === "form") {
              const actionResult = await action.handler();
              setActionResult(action.name, serializeActionResult2(actionResult));
            }
          }
          switch (this.routeData.type) {
            case "endpoint": {
              response2 = await renderEndpoint(
                componentInstance,
                ctx,
                this.routeData.prerender,
                logger
              );
              break;
            }
            case "redirect":
              return renderRedirect(this);
            case "page": {
              this.result = await this.createResult(componentInstance, actionApiContext);
              try {
                response2 = await renderPage(
                  this.result,
                  componentInstance?.default,
                  props,
                  slots,
                  streaming,
                  this.routeData
                );
              } catch (e) {
                this.result.cancelled = true;
                throw e;
              }
              response2.headers.set(ROUTE_TYPE_HEADER, "page");
              if (this.routeData.route === "/404" || this.routeData.route === "/500") {
                response2.headers.set(REROUTE_DIRECTIVE_HEADER, "no");
              }
              if (this.isRewriting) {
                response2.headers.set(REWRITE_DIRECTIVE_HEADER_KEY, REWRITE_DIRECTIVE_HEADER_VALUE);
              }
              break;
            }
            case "fallback": {
              return new Response(null, { status: 500, headers: { [ROUTE_TYPE_HEADER]: "fallback" } });
            }
          }
          const responseCookies = getCookiesFromResponse(response2);
          if (responseCookies) {
            cookies.merge(responseCookies);
          }
          return response2;
        }, "lastNext");
        if (isRouteExternalRedirect(this.routeData)) {
          return renderRedirect(this);
        }
        const response = await callMiddleware(middleware, apiContext, lastNext);
        if (response.headers.get(ROUTE_TYPE_HEADER)) {
          response.headers.delete(ROUTE_TYPE_HEADER);
        }
        attachCookiesToResponse(response, cookies);
        return response;
      }
      createAPIContext(props, context2) {
        const redirect = /* @__PURE__ */ __name((path, status = 302) => new Response(null, { status, headers: { Location: path } }), "redirect");
        Reflect.set(context2, apiContextRoutesSymbol, this.pipeline);
        return Object.assign(context2, {
          props,
          redirect,
          getActionResult: createGetActionResult(context2.locals),
          callAction: createCallAction(context2)
        });
      }
      async #executeRewrite(reroutePayload) {
        this.pipeline.logger.debug("router", "Calling rewrite: ", reroutePayload);
        const oldPathname = this.pathname;
        const { routeData, componentInstance, newUrl, pathname } = await this.pipeline.tryRewrite(
          reroutePayload,
          this.request
        );
        const isI18nFallback = routeData.fallbackRoutes && routeData.fallbackRoutes.length > 0;
        if (this.pipeline.serverLike && !this.routeData.prerender && routeData.prerender && !isI18nFallback) {
          throw new AstroError({
            ...ForbiddenRewrite,
            message: ForbiddenRewrite.message(this.pathname, pathname, routeData.component),
            hint: ForbiddenRewrite.hint(routeData.component)
          });
        }
        this.routeData = routeData;
        if (reroutePayload instanceof Request) {
          this.request = reroutePayload;
        } else {
          this.request = copyRequest(
            newUrl,
            this.request,
            // need to send the flag of the previous routeData
            routeData.prerender,
            this.pipeline.logger,
            this.routeData.route
          );
        }
        this.url = new URL(this.request.url);
        this.cookies = new AstroCookies(this.request);
        this.params = getParams(routeData, pathname);
        this.pathname = pathname;
        this.isRewriting = true;
        this.status = 200;
        setOriginPathname(
          this.request,
          oldPathname,
          this.pipeline.manifest.trailingSlash,
          this.pipeline.manifest.buildFormat
        );
        return await this.render(componentInstance);
      }
      createActionAPIContext() {
        const renderContext = this;
        const { cookies, params, pipeline, url } = this;
        const generator = `Astro v${ASTRO_VERSION}`;
        const rewrite = /* @__PURE__ */ __name(async (reroutePayload) => {
          return await this.#executeRewrite(reroutePayload);
        }, "rewrite");
        return {
          cookies,
          routePattern: this.routeData.route,
          isPrerendered: this.routeData.prerender,
          get clientAddress() {
            return renderContext.getClientAddress();
          },
          get currentLocale() {
            return renderContext.computeCurrentLocale();
          },
          generator,
          get locals() {
            return renderContext.locals;
          },
          set locals(_) {
            throw new AstroError(LocalsReassigned);
          },
          params,
          get preferredLocale() {
            return renderContext.computePreferredLocale();
          },
          get preferredLocaleList() {
            return renderContext.computePreferredLocaleList();
          },
          rewrite,
          request: this.request,
          site: pipeline.site,
          url,
          get originPathname() {
            return getOriginPathname(renderContext.request);
          },
          get session() {
            if (this.isPrerendered) {
              pipeline.logger.warn(
                "session",
                `context.session was used when rendering the route ${green(this.routePattern)}, but it is not available on prerendered routes. If you need access to sessions, make sure that the route is server-rendered using \`export const prerender = false;\` or by setting \`output\` to \`"server"\` in your Astro config to make all your routes server-rendered by default. For more information, see https://docs.astro.build/en/guides/sessions/`
              );
              return void 0;
            }
            if (!renderContext.session) {
              pipeline.logger.warn(
                "session",
                `context.session was used when rendering the route ${green(this.routePattern)}, but no storage configuration was provided. Either configure the storage manually or use an adapter that provides session storage. For more information, see https://docs.astro.build/en/guides/sessions/`
              );
              return void 0;
            }
            return renderContext.session;
          },
          insertDirective(payload) {
            if (!pipeline.manifest.csp) {
              throw new AstroError(CspNotEnabled);
            }
            renderContext.result?.directives.push(payload);
          },
          insertScriptResource(resource) {
            if (!pipeline.manifest.csp) {
              throw new AstroError(CspNotEnabled);
            }
            renderContext.result?.scriptResources.push(resource);
          },
          insertStyleResource(resource) {
            if (!pipeline.manifest.csp) {
              throw new AstroError(CspNotEnabled);
            }
            renderContext.result?.styleResources.push(resource);
          },
          insertStyleHash(hash) {
            if (!pipeline.manifest.csp) {
              throw new AstroError(CspNotEnabled);
            }
            renderContext.result?.styleHashes.push(hash);
          },
          insertScriptHash(hash) {
            if (!!pipeline.manifest.csp === false) {
              throw new AstroError(CspNotEnabled);
            }
            renderContext.result?.scriptHashes.push(hash);
          }
        };
      }
      async createResult(mod, ctx) {
        const { cookies, pathname, pipeline, routeData, status } = this;
        const { clientDirectives, inlinedScripts, compressHTML, manifest: manifest2, renderers: renderers2, resolve } = pipeline;
        const { links, scripts, styles } = await pipeline.headElements(routeData);
        const extraStyleHashes = [];
        const extraScriptHashes = [];
        const shouldInjectCspMetaTags = !!manifest2.csp;
        const cspAlgorithm = manifest2.csp?.algorithm ?? "SHA-256";
        if (shouldInjectCspMetaTags) {
          for (const style of styles) {
            extraStyleHashes.push(await generateCspDigest(style.children, cspAlgorithm));
          }
          for (const script of scripts) {
            extraScriptHashes.push(await generateCspDigest(script.children, cspAlgorithm));
          }
        }
        const componentMetadata = await pipeline.componentMetadata(routeData) ?? manifest2.componentMetadata;
        const headers = new Headers({ "Content-Type": "text/html" });
        const partial = typeof this.partial === "boolean" ? this.partial : Boolean(mod.partial);
        const actionResult = hasActionPayload(this.locals) ? deserializeActionResult(this.locals._actionPayload.actionResult) : void 0;
        const response = {
          status: actionResult?.error ? actionResult?.error.status : status,
          statusText: actionResult?.error ? actionResult?.error.type : "OK",
          get headers() {
            return headers;
          },
          // Disallow `Astro.response.headers = new Headers`
          set headers(_) {
            throw new AstroError(AstroResponseHeadersReassigned);
          }
        };
        const result = {
          base: manifest2.base,
          userAssetsBase: manifest2.userAssetsBase,
          cancelled: false,
          clientDirectives,
          inlinedScripts,
          componentMetadata,
          compressHTML,
          cookies,
          /** This function returns the `Astro` faux-global */
          createAstro: /* @__PURE__ */ __name((astroGlobal, props, slots) => this.createAstro(result, astroGlobal, props, slots, ctx), "createAstro"),
          links,
          params: this.params,
          partial,
          pathname,
          renderers: renderers2,
          resolve,
          response,
          request: this.request,
          scripts,
          styles,
          actionResult,
          serverIslandNameMap: manifest2.serverIslandNameMap ?? /* @__PURE__ */ new Map(),
          key: manifest2.key,
          trailingSlash: manifest2.trailingSlash,
          _metadata: {
            hasHydrationScript: false,
            rendererSpecificHydrationScripts: /* @__PURE__ */ new Set(),
            hasRenderedHead: false,
            renderedScripts: /* @__PURE__ */ new Set(),
            hasDirectives: /* @__PURE__ */ new Set(),
            hasRenderedServerIslandRuntime: false,
            headInTree: false,
            extraHead: [],
            extraStyleHashes,
            extraScriptHashes,
            propagators: /* @__PURE__ */ new Set()
          },
          cspDestination: manifest2.csp?.cspDestination ?? (routeData.prerender ? "meta" : "header"),
          shouldInjectCspMetaTags,
          cspAlgorithm,
          // The following arrays must be cloned, otherwise they become mutable across routes.
          scriptHashes: manifest2.csp?.scriptHashes ? [...manifest2.csp.scriptHashes] : [],
          scriptResources: manifest2.csp?.scriptResources ? [...manifest2.csp.scriptResources] : [],
          styleHashes: manifest2.csp?.styleHashes ? [...manifest2.csp.styleHashes] : [],
          styleResources: manifest2.csp?.styleResources ? [...manifest2.csp.styleResources] : [],
          directives: manifest2.csp?.directives ? [...manifest2.csp.directives] : [],
          isStrictDynamic: manifest2.csp?.isStrictDynamic ?? false
        };
        return result;
      }
      #astroPagePartial;
      /**
       * The Astro global is sourced in 3 different phases:
       * - **Static**: `.generator` and `.glob` is printed by the compiler, instantiated once per process per astro file
       * - **Page-level**: `.request`, `.cookies`, `.locals` etc. These remain the same for the duration of the request.
       * - **Component-level**: `.props`, `.slots`, and `.self` are unique to each _use_ of each component.
       *
       * The page level partial is used as the prototype of the user-visible `Astro` global object, which is instantiated once per use of a component.
       */
      createAstro(result, astroStaticPartial, props, slotValues, apiContext) {
        let astroPagePartial;
        if (this.isRewriting) {
          astroPagePartial = this.#astroPagePartial = this.createAstroPagePartial(
            result,
            astroStaticPartial,
            apiContext
          );
        } else {
          astroPagePartial = this.#astroPagePartial ??= this.createAstroPagePartial(
            result,
            astroStaticPartial,
            apiContext
          );
        }
        const astroComponentPartial = { props, self: null };
        const Astro = Object.assign(
          Object.create(astroPagePartial),
          astroComponentPartial
        );
        let _slots;
        Object.defineProperty(Astro, "slots", {
          get: /* @__PURE__ */ __name(() => {
            if (!_slots) {
              _slots = new Slots(
                result,
                slotValues,
                this.pipeline.logger
              );
            }
            return _slots;
          }, "get")
        });
        return Astro;
      }
      createAstroPagePartial(result, astroStaticPartial, apiContext) {
        const renderContext = this;
        const { cookies, locals, params, pipeline, url } = this;
        const { response } = result;
        const redirect = /* @__PURE__ */ __name((path, status = 302) => {
          if (this.request[responseSentSymbol]) {
            throw new AstroError({
              ...ResponseSentError
            });
          }
          return new Response(null, { status, headers: { Location: path } });
        }, "redirect");
        const rewrite = /* @__PURE__ */ __name(async (reroutePayload) => {
          return await this.#executeRewrite(reroutePayload);
        }, "rewrite");
        const callAction = createCallAction(apiContext);
        return {
          generator: astroStaticPartial.generator,
          glob: astroStaticPartial.glob,
          routePattern: this.routeData.route,
          isPrerendered: this.routeData.prerender,
          cookies,
          get session() {
            if (this.isPrerendered) {
              pipeline.logger.warn(
                "session",
                `Astro.session was used when rendering the route ${green(this.routePattern)}, but it is not available on prerendered pages. If you need access to sessions, make sure that the page is server-rendered using \`export const prerender = false;\` or by setting \`output\` to \`"server"\` in your Astro config to make all your pages server-rendered by default. For more information, see https://docs.astro.build/en/guides/sessions/`
              );
              return void 0;
            }
            if (!renderContext.session) {
              pipeline.logger.warn(
                "session",
                `Astro.session was used when rendering the route ${green(this.routePattern)}, but no storage configuration was provided. Either configure the storage manually or use an adapter that provides session storage. For more information, see https://docs.astro.build/en/guides/sessions/`
              );
              return void 0;
            }
            return renderContext.session;
          },
          get clientAddress() {
            return renderContext.getClientAddress();
          },
          get currentLocale() {
            return renderContext.computeCurrentLocale();
          },
          params,
          get preferredLocale() {
            return renderContext.computePreferredLocale();
          },
          get preferredLocaleList() {
            return renderContext.computePreferredLocaleList();
          },
          locals,
          redirect,
          rewrite,
          request: this.request,
          response,
          site: pipeline.site,
          getActionResult: createGetActionResult(locals),
          get callAction() {
            return callAction;
          },
          url,
          get originPathname() {
            return getOriginPathname(renderContext.request);
          },
          insertDirective(payload) {
            if (!pipeline.manifest.csp) {
              throw new AstroError(CspNotEnabled);
            }
            renderContext.result?.directives.push(payload);
          },
          insertScriptResource(resource) {
            if (!pipeline.manifest.csp) {
              throw new AstroError(CspNotEnabled);
            }
            renderContext.result?.scriptResources.push(resource);
          },
          insertStyleResource(resource) {
            if (!pipeline.manifest.csp) {
              throw new AstroError(CspNotEnabled);
            }
            renderContext.result?.styleResources.push(resource);
          },
          insertStyleHash(hash) {
            if (!pipeline.manifest.csp) {
              throw new AstroError(CspNotEnabled);
            }
            renderContext.result?.styleHashes.push(hash);
          },
          insertScriptHash(hash) {
            if (!!pipeline.manifest.csp === false) {
              throw new AstroError(CspNotEnabled);
            }
            renderContext.result?.scriptHashes.push(hash);
          }
        };
      }
      getClientAddress() {
        const { pipeline, request, routeData, clientAddress } = this;
        if (routeData.prerender) {
          throw new AstroError({
            ...PrerenderClientAddressNotAvailable,
            message: PrerenderClientAddressNotAvailable.message(routeData.component)
          });
        }
        if (clientAddress) {
          return clientAddress;
        }
        if (clientAddressSymbol in request) {
          return Reflect.get(request, clientAddressSymbol);
        }
        if (pipeline.adapterName) {
          throw new AstroError({
            ...ClientAddressNotAvailable,
            message: ClientAddressNotAvailable.message(pipeline.adapterName)
          });
        }
        throw new AstroError(StaticClientAddressNotAvailable);
      }
      /**
       * API Context may be created multiple times per request, i18n data needs to be computed only once.
       * So, it is computed and saved here on creation of the first APIContext and reused for later ones.
       */
      #currentLocale;
      computeCurrentLocale() {
        const {
          url,
          pipeline: { i18n },
          routeData
        } = this;
        if (!i18n) return;
        const { defaultLocale, locales, strategy } = i18n;
        const fallbackTo = strategy === "pathname-prefix-other-locales" || strategy === "domains-prefix-other-locales" ? defaultLocale : void 0;
        if (this.#currentLocale) {
          return this.#currentLocale;
        }
        let computedLocale;
        if (isRouteServerIsland(routeData)) {
          let referer = this.request.headers.get("referer");
          if (referer) {
            if (URL.canParse(referer)) {
              referer = new URL(referer).pathname;
            }
            computedLocale = computeCurrentLocale(referer, locales, defaultLocale);
          }
        } else {
          let pathname = routeData.pathname;
          if (!routeData.pattern.test(url.pathname)) {
            for (const fallbackRoute of routeData.fallbackRoutes) {
              if (fallbackRoute.pattern.test(url.pathname)) {
                pathname = fallbackRoute.pathname;
                break;
              }
            }
          }
          pathname = pathname && !isRoute404or500(routeData) ? pathname : url.pathname;
          computedLocale = computeCurrentLocale(pathname, locales, defaultLocale);
        }
        this.#currentLocale = computedLocale ?? fallbackTo;
        return this.#currentLocale;
      }
      #preferredLocale;
      computePreferredLocale() {
        const {
          pipeline: { i18n },
          request
        } = this;
        if (!i18n) return;
        return this.#preferredLocale ??= computePreferredLocale(request, i18n.locales);
      }
      #preferredLocaleList;
      computePreferredLocaleList() {
        const {
          pipeline: { i18n },
          request
        } = this;
        if (!i18n) return;
        return this.#preferredLocaleList ??= computePreferredLocaleList(request, i18n.locales);
      }
    };
    __name(sequence, "sequence");
    __name(defineMiddleware, "defineMiddleware");
  }
});

// dist/_worker.js/chunks/cloudflare-kv-binding_DMly_2Gl.mjs
var cloudflare_kv_binding_DMly_2Gl_exports = {};
__export(cloudflare_kv_binding_DMly_2Gl_exports, {
  default: () => cloudflareKvBinding
});
function defineDriver2(factory) {
  return factory;
}
function normalizeKey2(key, sep = ":") {
  if (!key) {
    return "";
  }
  return key.replace(/[:/\\]/g, sep).replace(/^[:/\\]|[:/\\]$/g, "");
}
function joinKeys2(...keys) {
  return keys.map((key) => normalizeKey2(key)).filter(Boolean).join(":");
}
function createError(driver, message, opts) {
  const err = new Error(`[unstorage] [${driver}] ${message}`, opts);
  if (Error.captureStackTrace) {
    Error.captureStackTrace(err, createError);
  }
  return err;
}
function getBinding(binding2) {
  let bindingName = "[binding]";
  if (typeof binding2 === "string") {
    bindingName = binding2;
    binding2 = globalThis[bindingName] || globalThis.__env__?.[bindingName];
  }
  if (!binding2) {
    throw createError(
      "cloudflare",
      `Invalid binding \`${bindingName}\`: \`${binding2}\``
    );
  }
  for (const key of ["get", "put", "delete"]) {
    if (!(key in binding2)) {
      throw createError(
        "cloudflare",
        `Invalid binding \`${bindingName}\`: \`${key}\` key is missing`
      );
    }
  }
  return binding2;
}
function getKVBinding(binding2 = "STORAGE") {
  return getBinding(binding2);
}
var DRIVER_NAME2, cloudflareKvBinding;
var init_cloudflare_kv_binding_DMly_2Gl = __esm({
  "dist/_worker.js/chunks/cloudflare-kv-binding_DMly_2Gl.mjs"() {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    globalThis.process ??= {};
    globalThis.process.env ??= {};
    __name(defineDriver2, "defineDriver");
    __name(normalizeKey2, "normalizeKey");
    __name(joinKeys2, "joinKeys");
    __name(createError, "createError");
    __name(getBinding, "getBinding");
    __name(getKVBinding, "getKVBinding");
    DRIVER_NAME2 = "cloudflare-kv-binding";
    cloudflareKvBinding = defineDriver2((opts) => {
      const r2 = /* @__PURE__ */ __name((key = "") => opts.base ? joinKeys2(opts.base, key) : key, "r");
      async function getKeys(base = "") {
        base = r2(base);
        const binding2 = getKVBinding(opts.binding);
        const keys = [];
        let cursor = void 0;
        do {
          const kvList = await binding2.list({ prefix: base || void 0, cursor });
          keys.push(...kvList.keys);
          cursor = kvList.list_complete ? void 0 : kvList.cursor;
        } while (cursor);
        return keys.map((key) => key.name);
      }
      __name(getKeys, "getKeys");
      return {
        name: DRIVER_NAME2,
        options: opts,
        getInstance: /* @__PURE__ */ __name(() => getKVBinding(opts.binding), "getInstance"),
        async hasItem(key) {
          key = r2(key);
          const binding2 = getKVBinding(opts.binding);
          return await binding2.get(key) !== null;
        },
        getItem(key) {
          key = r2(key);
          const binding2 = getKVBinding(opts.binding);
          return binding2.get(key);
        },
        setItem(key, value, topts) {
          key = r2(key);
          const binding2 = getKVBinding(opts.binding);
          return binding2.put(
            key,
            value,
            topts ? {
              expirationTtl: topts?.ttl ? Math.max(topts.ttl, opts.minTTL ?? 60) : void 0,
              ...topts
            } : void 0
          );
        },
        removeItem(key) {
          key = r2(key);
          const binding2 = getKVBinding(opts.binding);
          return binding2.delete(key);
        },
        getKeys(base) {
          return getKeys(base).then(
            (keys) => keys.map((key) => opts.base ? key.slice(opts.base.length) : key)
          );
        },
        async clear(base) {
          const binding2 = getKVBinding(opts.binding);
          const keys = await getKeys(base);
          await Promise.all(keys.map((key) => binding2.delete(key)));
        }
      };
    });
  }
});

// dist/_worker.js/pages/_image.astro.mjs
var image_astro_exports = {};
__export(image_astro_exports, {
  page: () => page,
  renderers: () => renderers
});
var prerender, GET, _page, page;
var init_image_astro = __esm({
  "dist/_worker.js/pages/_image.astro.mjs"() {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_renderers();
    globalThis.process ??= {};
    globalThis.process.env ??= {};
    prerender = false;
    GET = /* @__PURE__ */ __name((ctx) => {
      const href = ctx.url.searchParams.get("href");
      if (!href) {
        return new Response("Missing 'href' query parameter", {
          status: 400,
          statusText: "Missing 'href' query parameter"
        });
      }
      return fetch(new URL(href, ctx.url.origin));
    }, "GET");
    _page = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
      __proto__: null,
      GET,
      prerender
    }, Symbol.toStringTag, { value: "Module" }));
    page = /* @__PURE__ */ __name(() => _page, "page");
  }
});

// dist/_worker.js/chunks/ChatBox_BTFFVlFh.mjs
var $$Astro$b, $$Skeleton, $$Settingsmodal, $$Astro$a, $$Blogarticlecard, $$Astro$9, $$Footerheader, $$Astro$8, $$Servicecategory, $$Footerservices, $$Astro$7, $$Footerbottom, $$Astro$6, $$FooterMain, __freeze$2, __defProp$2, __template$2, _a$2, $$Astro$5, $$GoogleAnalytics, __freeze$1, __defProp$1, __template$1, _a$1, $$Astro$4, $$BaseLayout, $$MarqueeSimple, $$Astro$3, $$Button, __freeze, __defProp2, __template, _a, $$Astro$2, $$NavBar, $$Astro$1, $$Dockbutton, $$DockMenu, $$Astro, $$ChatBox;
var init_ChatBox_BTFFVlFh = __esm({
  "dist/_worker.js/chunks/ChatBox_BTFFVlFh.mjs"() {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_server_BRKsKzpO();
    globalThis.process ??= {};
    globalThis.process.env ??= {};
    $$Astro$b = createAstro();
    $$Skeleton = createComponent(($$result, $$props, $$slots) => {
      const Astro2 = $$result.createAstro($$Astro$b, $$props, $$slots);
      Astro2.self = $$Skeleton;
      const {
        variant = "text",
        width = "100%",
        height = "1rem",
        className = "",
        count: count3 = 1
      } = Astro2.props;
      const getSkeletonClass = /* @__PURE__ */ __name((variant2) => {
        const baseClass = "animate-pulse bg-gray-200 dark:bg-gray-700 rounded";
        switch (variant2) {
          case "text":
            return `${baseClass} h-4`;
          case "card":
            return `${baseClass} h-32`;
          case "button":
            return `${baseClass} h-10`;
          case "avatar":
            return `${baseClass} rounded-full w-8 h-8`;
          case "toggle":
            return `${baseClass} w-11 h-6 rounded-full`;
          default:
            return baseClass;
        }
      }, "getSkeletonClass");
      return renderTemplate`${Array.from({ length: count3 }).map(() => renderTemplate`${maybeRenderHead()}<div${addAttribute(`${getSkeletonClass(variant)} ${className}`, "class")}${addAttribute(`width: ${width}; height: ${height};`, "style")} aria-hidden="true" data-astro-cid-xsegquvp></div>`)}`;
    }, "/Volumes/MannyKnows/MK/MannyKnows/src/components/ui/Skeleton.astro", void 0);
    $$Settingsmodal = createComponent(($$result, $$props, $$slots) => {
      return renderTemplate`<!-- Settings Modal -->${maybeRenderHead()}<div id="settingsModal" class="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center opacity-0 invisible transition-all duration-300" role="dialog" aria-labelledby="settingsTitle" aria-modal="true" data-astro-cid-c5kad26w> <!-- Settings Modal Content with skeleton loading --> <div class="bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border border-gray-300/50 dark:border-white/10 rounded-2xl shadow-2xl max-w-md w-full mx-4 transform scale-95 transition-all duration-300" data-astro-cid-c5kad26w> <!-- Header --> <div class="flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-white/10" data-astro-cid-c5kad26w> <h2 id="settingsTitle" class="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-3" data-astro-cid-c5kad26w> <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-gray-600 dark:text-gray-400" data-astro-cid-c5kad26w> <circle cx="12" cy="12" r="3" data-astro-cid-c5kad26w></circle> <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24" data-astro-cid-c5kad26w></path> </svg>
Settings
</h2> <button id="closeSettings" class="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-200 p-1 rounded-lg hover:bg-gray-100/50 dark:hover:bg-white/10" aria-label="Close settings" data-astro-cid-c5kad26w> <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-astro-cid-c5kad26w> <line x1="18" y1="6" x2="6" y2="18" data-astro-cid-c5kad26w></line> <line x1="6" y1="6" x2="18" y2="18" data-astro-cid-c5kad26w></line> </svg> </button> </div> <!-- Settings Content --> <div class="p-6 space-y-6" data-astro-cid-c5kad26w> <!-- Theme Setting --> <div class="flex items-center justify-between" data-astro-cid-c5kad26w> <div class="flex items-center gap-3" data-astro-cid-c5kad26w> <div class="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center" data-astro-cid-c5kad26w> <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-blue-600 dark:text-blue-400" data-astro-cid-c5kad26w> <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" data-astro-cid-c5kad26w></path> </svg> </div> <div data-astro-cid-c5kad26w> <label for="themeToggle" class="text-sm font-semibold text-gray-800 dark:text-white cursor-pointer" data-astro-cid-c5kad26w>
Dark Mode
</label> <p class="text-xs text-gray-600 dark:text-gray-400 mt-0.5" data-astro-cid-c5kad26w>
Switch between light and dark themes
</p> </div> </div> <div class="flex items-center" data-astro-cid-c5kad26w> <!-- Show skeleton while loading --> <noscript> ${renderComponent($$result, "Skeleton", $$Skeleton, { "variant": "toggle", "data-astro-cid-c5kad26w": true })} </noscript> <label class="relative inline-flex items-center cursor-pointer" data-astro-cid-c5kad26w> <input type="checkbox" id="themeToggle" class="sr-only peer" checked data-astro-cid-c5kad26w> <div class="relative w-14 h-8 bg-gray-200 dark:bg-gray-700 rounded-full peer-focus:ring-4 peer-focus:ring-blue-300/30 dark:peer-focus:ring-blue-800/30 transition-all duration-300 peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-indigo-600 shadow-inner" data-astro-cid-c5kad26w> <div class="absolute top-0.5 left-0.5 w-7 h-7 bg-white rounded-full shadow-lg transform transition-transform duration-300 peer-checked:translate-x-6 flex items-center justify-center" data-astro-cid-c5kad26w> <svg class="absolute w-4 h-4 text-yellow-500 transition-opacity duration-200 opacity-100 peer-checked:opacity-0" viewBox="0 0 20 20" fill="currentColor" data-astro-cid-c5kad26w> <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd" data-astro-cid-c5kad26w></path> </svg> <svg class="absolute w-4 h-4 text-slate-700 transition-opacity duration-200 opacity-0 peer-checked:opacity-100" viewBox="0 0 20 20" fill="currentColor" data-astro-cid-c5kad26w> <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" data-astro-cid-c5kad26w></path> </svg> </div> </div> </label> </div> </div> <!-- Marquee Setting --> <div class="flex items-center justify-between" data-astro-cid-c5kad26w> <div class="flex items-center gap-3" data-astro-cid-c5kad26w> <div class="w-10 h-10 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg flex items-center justify-center" data-astro-cid-c5kad26w> <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-green-600 dark:text-green-400" data-astro-cid-c5kad26w> <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z" data-astro-cid-c5kad26w></path> <path d="M8 21l4-7 4 7M13 10V7" data-astro-cid-c5kad26w></path> </svg> </div> <div data-astro-cid-c5kad26w> <label for="marqueeToggle" class="text-sm font-semibold text-gray-800 dark:text-white cursor-pointer" data-astro-cid-c5kad26w>
Show Marquee
</label> <p class="text-xs text-gray-600 dark:text-gray-400 mt-0.5" data-astro-cid-c5kad26w>
Display the animated text marquee
</p> </div> </div> <div class="flex items-center" data-astro-cid-c5kad26w> <label class="relative inline-flex items-center cursor-pointer" data-astro-cid-c5kad26w> <input type="checkbox" id="marqueeToggle" class="sr-only peer" checked data-astro-cid-c5kad26w> <div class="relative w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300/50 dark:peer-focus:ring-green-800/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all duration-300 peer-checked:bg-gradient-to-r peer-checked:from-green-500 peer-checked:to-emerald-500" data-astro-cid-c5kad26w></div> </label> </div> </div> <!-- Colorful Titles Setting --> <div class="flex items-center justify-between" data-astro-cid-c5kad26w> <div class="flex items-center gap-3" data-astro-cid-c5kad26w> <div class="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center" data-astro-cid-c5kad26w> <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-purple-600 dark:text-purple-400" data-astro-cid-c5kad26w> <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" data-astro-cid-c5kad26w></path> </svg> </div> <div data-astro-cid-c5kad26w> <label for="colorfulTitlesToggle" class="text-sm font-semibold text-gray-800 dark:text-white cursor-pointer" data-astro-cid-c5kad26w>
Colorful Titles
</label> <p class="text-xs text-gray-600 dark:text-gray-400 mt-0.5" data-astro-cid-c5kad26w>
Show gradient and animated text colors
</p> </div> </div> <div class="flex items-center" data-astro-cid-c5kad26w> <label class="relative inline-flex items-center cursor-pointer" data-astro-cid-c5kad26w> <input type="checkbox" id="colorfulTitlesToggle" class="sr-only peer" checked data-astro-cid-c5kad26w> <div class="relative w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300/50 dark:peer-focus:ring-purple-800/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all duration-300 peer-checked:bg-gradient-to-r peer-checked:from-purple-500 peer-checked:to-pink-500" data-astro-cid-c5kad26w></div> </label> </div> </div> <!-- Analytics Notice --> <div class="bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-400/20 rounded-lg p-4" data-astro-cid-c5kad26w> <div class="flex items-start gap-3" data-astro-cid-c5kad26w> <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" data-astro-cid-c5kad26w> <circle cx="12" cy="12" r="10" data-astro-cid-c5kad26w></circle> <path d="M12 16v-4M12 8h.01" data-astro-cid-c5kad26w></path> </svg> <div data-astro-cid-c5kad26w> <p class="text-xs font-medium text-blue-800 dark:text-blue-200" data-astro-cid-c5kad26w>
Privacy Notice
</p> <p class="text-xs text-blue-700 dark:text-blue-300 mt-1" data-astro-cid-c5kad26w>
Your preferences help us improve the site experience. Settings are stored locally and anonymized usage data may be collected.
</p> </div> </div> </div> </div> <!-- Footer --> <div class="flex justify-end gap-3 p-6 pt-0" data-astro-cid-c5kad26w> <button id="resetSettings" class="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200" data-astro-cid-c5kad26w>
Reset to Default
</button> <button id="saveSettings" class="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200" data-astro-cid-c5kad26w>
Save Changes
</button> </div> </div> </div> ${renderScript($$result, "/Volumes/MannyKnows/MK/MannyKnows/src/components/settingsmodal.astro?astro&type=script&index=0&lang.ts")} `;
    }, "/Volumes/MannyKnows/MK/MannyKnows/src/components/settingsmodal.astro", void 0);
    $$Astro$a = createAstro();
    $$Blogarticlecard = createComponent(($$result, $$props, $$slots) => {
      const Astro2 = $$result.createAstro($$Astro$a, $$props, $$slots);
      Astro2.self = $$Blogarticlecard;
      const { icon, category, title: title2, categoryColor, href } = Astro2.props;
      const iconSvgs = {
        chat: `<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>`,
        document: `<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14,2 14,8 20,8"></polyline>`,
        analytics: `<line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line>`
      };
      const bannerIconSvgs = {
        chat: `<path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>`,
        document: `<path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>`,
        analytics: `<path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>`
      };
      const colorMap = {
        blue: {
          gradient: "from-blue-500/20 to-cyan-500/20",
          iconColor: "text-blue-400",
          badgeBg: "bg-blue-500/20",
          badgeText: "text-blue-400",
          hoverText: "group-hover:text-blue-600 dark:group-hover:text-blue-400",
          buttonColor: "text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300",
          shadowColor: "rgba(59, 130, 246, 0.1)",
          hoverShadowColor: "rgba(59, 130, 246, 0.3)"
        },
        purple: {
          gradient: "from-purple-500/20 to-pink-500/20",
          iconColor: "text-purple-400",
          badgeBg: "bg-purple-500/20",
          badgeText: "text-purple-400",
          hoverText: "group-hover:text-purple-600 dark:group-hover:text-purple-400",
          buttonColor: "text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300",
          shadowColor: "rgba(139, 92, 246, 0.1)",
          hoverShadowColor: "rgba(139, 92, 246, 0.3)"
        },
        orange: {
          gradient: "from-orange-500/20 to-yellow-500/20",
          iconColor: "text-orange-400",
          badgeBg: "bg-orange-500/20",
          badgeText: "text-orange-400",
          hoverText: "group-hover:text-orange-600 dark:group-hover:text-orange-400",
          buttonColor: "text-orange-600 dark:text-orange-400 hover:text-orange-500 dark:hover:text-orange-300",
          shadowColor: "rgba(249, 115, 22, 0.1)",
          hoverShadowColor: "rgba(249, 115, 22, 0.3)"
        }
      };
      const colors = colorMap[categoryColor];
      return renderTemplate`${maybeRenderHead()}<article class="group cursor-pointer space-y-3"> <!-- Icon and Banner Row --> <div class="flex gap-3"> <div${addAttribute(`w-16 h-16 backdrop-blur-lg border border-gray-200/30 dark:border-white/20 rounded-lg flex-shrink-0 flex items-center justify-center transition-all duration-500 relative overflow-hidden group/icon`, "class")}${addAttribute(`background: linear-gradient(135deg, ${colors.shadowColor.replace("0.1", "0.15")}, ${colors.shadowColor.replace("0.1", "0.08")}); box-shadow: 0 4px 20px ${colors.shadowColor};`, "style")}${addAttribute(`this.style.background='linear-gradient(135deg, ${colors.hoverShadowColor.replace("0.3", "0.25")}, ${colors.hoverShadowColor.replace("0.3", "0.15")})'; this.style.boxShadow='0 8px 32px ${colors.hoverShadowColor}';`, "onmouseenter")}${addAttribute(`this.style.background='linear-gradient(135deg, ${colors.shadowColor.replace("0.1", "0.15")}, ${colors.shadowColor.replace("0.1", "0.08")})'; this.style.boxShadow='0 4px 20px ${colors.shadowColor}';`, "onmouseleave")}> <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent -translate-x-full group-hover/icon:translate-x-full transition-transform duration-700 opacity-0 group-hover/icon:opacity-100"></div> <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"${addAttribute(`${colors.iconColor} relative z-10 transition-transform duration-300`, "class")}> ${renderComponent($$result, "Fragment", Fragment, {}, { "default": /* @__PURE__ */ __name(($$result2) => renderTemplate`${unescapeHTML(iconSvgs[icon])}`, "default") })} </svg> </div> <div${addAttribute(`flex-1 h-16 backdrop-blur-lg border border-gray-200/30 dark:border-white/20 rounded-lg overflow-hidden flex items-center justify-center transition-all duration-500 relative group/banner`, "class")}${addAttribute(`background: linear-gradient(135deg, ${colors.shadowColor.replace("0.1", "0.10")}, ${colors.shadowColor.replace("0.1", "0.05")}); box-shadow: 0 2px 15px ${colors.shadowColor.replace("0.1", "0.05")};`, "style")}${addAttribute(`this.style.background='linear-gradient(135deg, ${colors.hoverShadowColor.replace("0.3", "0.15")}, ${colors.hoverShadowColor.replace("0.3", "0.08")})'; this.style.boxShadow='0 4px 25px ${colors.hoverShadowColor.replace("0.3", "0.2")}';`, "onmouseenter")}${addAttribute(`this.style.background='linear-gradient(135deg, ${colors.shadowColor.replace("0.1", "0.10")}, ${colors.shadowColor.replace("0.1", "0.05")})'; this.style.boxShadow='0 2px 15px ${colors.shadowColor.replace("0.1", "0.05")}';`, "onmouseleave")}> <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/6 to-transparent -translate-x-full group-hover/banner:translate-x-full transition-transform duration-1000 opacity-0 group-hover/banner:opacity-100"></div> <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"${addAttribute(`${colors.iconColor}/60 relative z-10 transition-transform duration-300`, "class")}> ${renderComponent($$result, "Fragment", Fragment, {}, { "default": /* @__PURE__ */ __name(($$result2) => renderTemplate`${unescapeHTML(bannerIconSvgs[icon])}`, "default") })} </svg> </div> </div> <!-- Content Below --> <div class="space-y-2"> <span${addAttribute(`inline-block px-2 py-1 ${colors.badgeBg} ${colors.badgeText} text-xs rounded-md`, "class")}> ${category} </span> <div> <h5${addAttribute(`text-gray-800 dark:text-white/90 text-sm font-medium ${colors.hoverText} transition-colors duration-300 mb-1`, "class")}> ${title2} </h5> <a${addAttribute(href, "href")}${addAttribute(`${colors.buttonColor} text-xs transition-colors duration-300 font-medium`, "class")}>
Read more →
</a> </div> </div> </article>`;
    }, "/Volumes/MannyKnows/MK/MannyKnows/src/components/footer/blogarticlecard.astro", void 0);
    $$Astro$9 = createAstro();
    $$Footerheader = createComponent(($$result, $$props, $$slots) => {
      const Astro2 = $$result.createAstro($$Astro$9, $$props, $$slots);
      Astro2.self = $$Footerheader;
      const {
        brandTitle = "MK",
        brandDescription = "Professional AI-powered business solutions. From intelligent automation to data-driven insights, helping businesses grow smarter and faster.",
        socialLinks = {
          linkedin: "https://www.linkedin.com/in/mrmanu/",
          youtube: "https://www.youtube.com/@MannyKnows-com/posts",
          tiktok: "https://www.tiktok.com/@mannyknowsai"
        },
        target = "_blank"
      } = Astro2.props;
      const blogArticles = [
        {
          icon: "chat",
          category: "AI & Technology",
          title: "How AI is Transforming E-commerce",
          categoryColor: "blue",
          href: "/contact-us"
        },
        {
          icon: "document",
          category: "Content Strategy",
          title: "AI Content Creation: The Future of Marketing",
          categoryColor: "purple",
          href: "/contact-us"
        },
        {
          icon: "analytics",
          category: "Data Analytics",
          title: "Predictive Analytics: Making Data-Driven Decisions",
          categoryColor: "orange",
          href: "/contact-us"
        }
      ];
      return renderTemplate`${maybeRenderHead()}<div class="max-w-[1440px] mx-auto pt-[4.5rem] pb-0" data-astro-cid-6dhjeony> <div class="grid grid-cols-1 lg:grid-cols-3 gap-8" data-astro-cid-6dhjeony> <!-- Column 1: Brand & Social (1 column = 33%) --> <div id="about" class="lg:col-span-1 space-y-8 px-4 lg:px-6" data-astro-cid-6dhjeony> <!-- Brand Section --> <div class="text-left" data-astro-cid-6dhjeony> <h3 class="text-6xl font-black text-gray-800 dark:text-white mb-6 transition-colors duration-300" data-astro-cid-6dhjeony> <span class="apple-gradient-text bg-gradient-to-r from-primary-blue via-purple-500 to-primary-pink bg-clip-text text-transparent animate-button-gradient" data-astro-cid-6dhjeony> ${brandTitle} </span> </h3> <p class="text-gray-700 dark:text-white/80 leading-relaxed text-sm mb-8 transition-colors duration-300" data-astro-cid-6dhjeony> ${brandDescription} </p> </div> <!-- Social Links --> <div data-astro-cid-6dhjeony> <h6 class="apple-gradient-text text-gray-800 dark:text-white/90 font-medium mb-4 text-center transition-colors duration-300" data-astro-cid-6dhjeony>Follow Us</h6> <div class="flex gap-3 justify-center" data-astro-cid-6dhjeony> <!-- LinkedIn --> <a${addAttribute(socialLinks.linkedin, "href")}${addAttribute(target, "target")} class="group w-10 h-10 backdrop-blur-lg border border-gray-200/30 dark:border-white/20 rounded-xl flex items-center justify-center text-gray-700 dark:text-gray-300 hover:text-[#0077B5] dark:hover:text-white transition-all duration-500 relative overflow-hidden" style="background: linear-gradient(135deg, #0077B525, #0077B515); box-shadow: 0 4px 20px rgba(0, 119, 181, 0.15);" onmouseenter="this.style.background='linear-gradient(135deg, #0077B540, #0077B530)'; this.style.boxShadow='0 8px 32px rgba(0, 119, 181, 0.4), 0 0 20px rgba(0, 119, 181, 0.3)'" onmouseleave="this.style.background='linear-gradient(135deg, #0077B525, #0077B515)'; this.style.boxShadow='0 4px 20px rgba(0, 119, 181, 0.15)'" data-astro-cid-6dhjeony> <!-- Sparkle effects --> <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" data-astro-cid-6dhjeony> <div class="absolute top-1 left-1 w-1 h-1 bg-white rounded-full animate-ping" style="animation-delay: 0s;" data-astro-cid-6dhjeony></div> <div class="absolute top-2 right-2 w-0.5 h-0.5 bg-blue-300 rounded-full animate-ping" style="animation-delay: 0.3s;" data-astro-cid-6dhjeony></div> <div class="absolute bottom-2 left-2 w-0.5 h-0.5 bg-white rounded-full animate-ping" style="animation-delay: 0.6s;" data-astro-cid-6dhjeony></div> <div class="absolute bottom-1 right-1 w-1 h-1 bg-blue-200 rounded-full animate-ping" style="animation-delay: 0.9s;" data-astro-cid-6dhjeony></div> </div> <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/12 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 opacity-0 group-hover:opacity-100" data-astro-cid-6dhjeony></div> <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24" class="transition-transform duration-300 relative z-10 drop-shadow-lg group-hover:drop-shadow-xl" data-astro-cid-6dhjeony> <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" data-astro-cid-6dhjeony></path> </svg> </a> <!-- YouTube --> <a${addAttribute(socialLinks.youtube, "href")}${addAttribute(target, "target")} class="group w-10 h-10 backdrop-blur-lg border border-gray-200/30 dark:border-white/20 rounded-xl flex items-center justify-center text-gray-700 dark:text-gray-300 hover:text-[#FF0000] dark:hover:text-white transition-all duration-500 relative overflow-hidden" style="background: linear-gradient(135deg, #FF000025, #FF000015); box-shadow: 0 4px 20px rgba(255, 0, 0, 0.15);" onmouseenter="this.style.background='linear-gradient(135deg, #FF000040, #FF000030)'; this.style.boxShadow='0 8px 32px rgba(255, 0, 0, 0.4), 0 0 20px rgba(255, 0, 0, 0.3)'" onmouseleave="this.style.background='linear-gradient(135deg, #FF000025, #FF000015)'; this.style.boxShadow='0 4px 20px rgba(255, 0, 0, 0.15)'" data-astro-cid-6dhjeony> <!-- Sparkle effects --> <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" data-astro-cid-6dhjeony> <div class="absolute top-1 left-1 w-1 h-1 bg-white rounded-full animate-ping" style="animation-delay: 0s;" data-astro-cid-6dhjeony></div> <div class="absolute top-2 right-2 w-0.5 h-0.5 bg-red-300 rounded-full animate-ping" style="animation-delay: 0.3s;" data-astro-cid-6dhjeony></div> <div class="absolute bottom-2 left-2 w-0.5 h-0.5 bg-white rounded-full animate-ping" style="animation-delay: 0.6s;" data-astro-cid-6dhjeony></div> <div class="absolute bottom-1 right-1 w-1 h-1 bg-red-200 rounded-full animate-ping" style="animation-delay: 0.9s;" data-astro-cid-6dhjeony></div> </div> <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/12 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 opacity-0 group-hover:opacity-100" data-astro-cid-6dhjeony></div> <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24" class="transition-transform duration-300 relative z-10 drop-shadow-lg group-hover:drop-shadow-xl" data-astro-cid-6dhjeony> <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" data-astro-cid-6dhjeony></path> </svg> </a> <!-- TikTok --> <a${addAttribute(socialLinks.tiktok, "href")}${addAttribute(target, "target")} class="group w-10 h-10 backdrop-blur-lg border border-gray-200/30 dark:border-white/20 rounded-xl flex items-center justify-center text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-all duration-500 relative overflow-hidden" style="background: linear-gradient(135deg, #00000030, #00000020); box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);" onmouseenter="this.style.background='linear-gradient(135deg, #00000050, #00000040)'; this.style.boxShadow='0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(100, 100, 255, 0.2)'" onmouseleave="this.style.background='linear-gradient(135deg, #00000030, #00000020)'; this.style.boxShadow='0 4px 20px rgba(0, 0, 0, 0.15)'" data-astro-cid-6dhjeony> <!-- Sparkle effects --> <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" data-astro-cid-6dhjeony> <div class="absolute top-1 left-1 w-1 h-1 bg-white rounded-full animate-ping" style="animation-delay: 0s;" data-astro-cid-6dhjeony></div> <div class="absolute top-2 right-2 w-0.5 h-0.5 bg-purple-300 rounded-full animate-ping" style="animation-delay: 0.3s;" data-astro-cid-6dhjeony></div> <div class="absolute bottom-2 left-2 w-0.5 h-0.5 bg-white rounded-full animate-ping" style="animation-delay: 0.6s;" data-astro-cid-6dhjeony></div> <div class="absolute bottom-1 right-1 w-1 h-1 bg-pink-200 rounded-full animate-ping" style="animation-delay: 0.9s;" data-astro-cid-6dhjeony></div> </div> <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/12 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 opacity-0 group-hover:opacity-100" data-astro-cid-6dhjeony></div> <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24" class="transition-transform duration-300 relative z-10 drop-shadow-lg group-hover:drop-shadow-xl" data-astro-cid-6dhjeony> <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" data-astro-cid-6dhjeony></path> </svg> </a> </div> </div> <div data-astro-cid-6dhjeony> <!-- Newsletter Signup --> <div class="rounded-xl p-4 transition-colors duration-300" data-astro-cid-6dhjeony> <h4 class="apple-gradient-text text-lg font-bold text-gray-800 dark:text-white mb-2 transition-colors duration-300" data-astro-cid-6dhjeony>
AI Insights
</h4> <p class="text-gray-700 dark:text-white/80 text-xs mb-4 leading-relaxed transition-colors duration-300" data-astro-cid-6dhjeony>
Get exclusive tips and trends delivered to your inbox.
</p> <form class="space-y-3" data-np-autofill-form-type="subscribe" data-np-checked="1" data-np-watching="1" data-astro-cid-6dhjeony> <input type="email" placeholder="Your email" class="w-full px-3 py-2 backdrop-blur-lg border border-gray-200/30 dark:border-white/20 rounded-lg text-gray-800 dark:text-white placeholder-gray-600 dark:placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-primary-blue/50 focus:border-primary-blue/50 transition-all duration-500 text-sm" style="background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05)); box-shadow: 0 2px 10px rgba(0,0,0,0.1);" required data-np-autofill-field-type="email" data-astro-cid-6dhjeony> <button type="submit" class="w-full bg-gradient-to-r from-primary-blue via-purple-500 to-primary-pink text-white py-3 px-6 rounded-xl text-sm hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(16,209,255,0.3)] animate-button-gradient no-underline font-semibold inline-flex items-center justify-center relative transition-all duration-300 group" data-astro-cid-6dhjeony> <span class="relative z-10 flex items-center gap-2" data-astro-cid-6dhjeony> <span data-astro-cid-6dhjeony>Subscribe</span> <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-astro-cid-6dhjeony> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" data-astro-cid-6dhjeony></path> </svg> </span> </button> <div class="flex items-center gap-2 text-xs text-gray-600 dark:text-white/60 transition-colors duration-300" data-astro-cid-6dhjeony> <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-astro-cid-6dhjeony> <path d="M9 12l2 2 4-4" data-astro-cid-6dhjeony></path> <circle cx="12" cy="12" r="9" data-astro-cid-6dhjeony></circle> </svg>
No spam. Unsubscribe anytime.
</div> </form> </div> </div> </div> <!-- Column 2: Latest AI Insights Blog Articles (1 column = 33%) --> <div class="lg:col-span-1 space-y-6 px-4 lg:px-6" data-astro-cid-6dhjeony> <div data-astro-cid-6dhjeony> <h4 class="apple-gradient-text text-2xl font-bold text-gray-800 dark:text-white mb-6 text-left transition-colors duration-300" data-colorful-title="" data-astro-cid-6dhjeony>Latest AI Insights</h4> <div class="space-y-6" data-astro-cid-6dhjeony> ${blogArticles.map((article) => renderTemplate`${renderComponent($$result, "BlogArticleCard", $$Blogarticlecard, { ...article, "data-astro-cid-6dhjeony": true })}`)} </div> </div> </div> <!-- Column 3: Newsletter Signup (1 column = 33%) --> <div class="lg:col-span-1 space-y-6 px-4 lg:px-6" data-astro-cid-6dhjeony></div> </div> </div> `;
    }, "/Volumes/MannyKnows/MK/MannyKnows/src/components/footer/footerheader.astro", void 0);
    $$Astro$8 = createAstro();
    $$Servicecategory = createComponent(($$result, $$props, $$slots) => {
      const Astro2 = $$result.createAstro($$Astro$8, $$props, $$slots);
      Astro2.self = $$Servicecategory;
      const {
        title: title2,
        icon,
        iconGradient,
        textColor,
        borderColor,
        services,
        backgroundGradient,
        hasSecondarySection = false,
        secondaryTitle,
        secondaryIcon,
        secondaryIconGradient,
        secondaryTextColor,
        secondaryServices = [],
        hasThirdSection = false,
        thirdTitle,
        thirdIcon,
        thirdIconGradient,
        thirdTextColor,
        thirdServices = [],
        roundedClass = "",
        borderClasses = "border-t border-l border-r"
      } = Astro2.props;
      const getHoverColor = /* @__PURE__ */ __name((textColor2) => {
        if (textColor2.includes("indigo")) return "99, 102, 241";
        if (textColor2.includes("green")) return "34, 197, 94";
        if (textColor2.includes("rose")) return "244, 63, 94";
        if (textColor2.includes("blue")) return "59, 130, 246";
        if (textColor2.includes("teal")) return "20, 184, 166";
        return "99, 102, 241";
      }, "getHoverColor");
      const hoverColorRGB = getHoverColor(textColor);
      return renderTemplate`${maybeRenderHead()}<div${addAttribute(`service-box-padding bg-gradient-to-br ${backgroundGradient} backdrop-blur-sm ${roundedClass} ${borderClasses} ${borderColor} transition-all duration-300 group`, "class")}${addAttribute(`--hover-color: ${hoverColorRGB};`, "style")}${addAttribute(`this.style.boxShadow = '0 8px 32px rgba(${hoverColorRGB}, 0.15), 0 4px 20px rgba(${hoverColorRGB}, 0.1), 0 2px 8px rgba(0, 0, 0, 0.1)';`, "onmouseenter")}${addAttribute(`this.style.boxShadow = '';`, "onmouseleave")} data-astro-cid-xudwutji> <!-- Primary Section --> <div class="flex items-center gap-3 mb-3" data-astro-cid-xudwutji> <div${addAttribute(`w-8 h-8 bg-gradient-to-r ${iconGradient} rounded-lg flex items-center justify-center`, "class")} data-astro-cid-xudwutji> ${renderComponent($$result, "Fragment", Fragment, {}, { "default": /* @__PURE__ */ __name(($$result2) => renderTemplate`${unescapeHTML(icon)}`, "default") })} </div> <h4${addAttribute(`text-lg font-semibold ${textColor}`, "class")} data-astro-cid-xudwutji>${title2}</h4> </div> <ul${addAttribute(`space-y-2 ${hasSecondarySection ? "mb-6" : ""}`, "class")} data-astro-cid-xudwutji> ${services.map((service) => renderTemplate`<li data-astro-cid-xudwutji> <a${addAttribute(service.href, "href")}${addAttribute(`${textColor} transition-colors duration-300 text-sm flex items-center gap-2`, "class")} data-astro-cid-xudwutji> <span${addAttribute(`w-1.5 h-1.5 ${textColor.replace("text-", "bg-")}/60 rounded-full`, "class")} data-astro-cid-xudwutji></span> ${service.label} </a> </li>`)} </ul> ${hasSecondarySection && renderTemplate`${renderComponent($$result, "Fragment", Fragment, { "data-astro-cid-xudwutji": true }, { "default": /* @__PURE__ */ __name(($$result2) => renderTemplate`  <div class="h-px bg-white/10 mb-4" data-astro-cid-xudwutji></div>  <div class="flex items-center gap-3 mb-3" data-astro-cid-xudwutji> <div${addAttribute(`w-8 h-8 bg-gradient-to-r ${secondaryIconGradient} rounded-lg flex items-center justify-center`, "class")} data-astro-cid-xudwutji> ${renderComponent($$result2, "Fragment", Fragment, {}, { "default": /* @__PURE__ */ __name(($$result3) => renderTemplate`${unescapeHTML(secondaryIcon)}`, "default") })} </div> <h4${addAttribute(`text-lg font-semibold ${secondaryTextColor}`, "class")} data-astro-cid-xudwutji>${secondaryTitle}</h4> </div> <ul${addAttribute(`space-y-2 ${hasThirdSection ? "mb-6" : ""}`, "class")} data-astro-cid-xudwutji> ${secondaryServices.map((service) => renderTemplate`<li data-astro-cid-xudwutji> <a${addAttribute(service.href, "href")}${addAttribute(`${secondaryTextColor || textColor} transition-colors duration-300 text-sm flex items-center gap-2`, "class")} data-astro-cid-xudwutji> <span${addAttribute(`w-1.5 h-1.5 ${(secondaryTextColor || textColor).replace("text-", "bg-")}/60 rounded-full`, "class")} data-astro-cid-xudwutji></span> ${service.label} </a> </li>`)} </ul> `, "default") })}`} ${hasThirdSection && renderTemplate`${renderComponent($$result, "Fragment", Fragment, { "data-astro-cid-xudwutji": true }, { "default": /* @__PURE__ */ __name(($$result2) => renderTemplate`  <div class="h-px bg-white/10 mb-4" data-astro-cid-xudwutji></div>  <div class="flex items-center gap-3 mb-3" data-astro-cid-xudwutji> <div${addAttribute(`w-8 h-8 bg-gradient-to-r ${thirdIconGradient} rounded-lg flex items-center justify-center`, "class")} data-astro-cid-xudwutji> ${renderComponent($$result2, "Fragment", Fragment, {}, { "default": /* @__PURE__ */ __name(($$result3) => renderTemplate`${unescapeHTML(thirdIcon)}`, "default") })} </div> <h4${addAttribute(`text-lg font-semibold ${thirdTextColor}`, "class")} data-astro-cid-xudwutji>${thirdTitle}</h4> </div> <ul class="space-y-2" data-astro-cid-xudwutji> ${thirdServices.map((service) => renderTemplate`<li data-astro-cid-xudwutji> <a${addAttribute(service.href, "href")}${addAttribute(`${thirdTextColor || textColor} transition-colors duration-300 text-sm flex items-center gap-2`, "class")} data-astro-cid-xudwutji> <span${addAttribute(`w-1.5 h-1.5 ${(thirdTextColor || textColor).replace("text-", "bg-")}/60 rounded-full`, "class")} data-astro-cid-xudwutji></span> ${service.label} </a> </li>`)} </ul> `, "default") })}`} </div> `;
    }, "/Volumes/MannyKnows/MK/MannyKnows/src/components/footer/servicecategory.astro", void 0);
    $$Footerservices = createComponent(($$result, $$props, $$slots) => {
      const serviceCategories = [
        // eCommerce & Web Development
        {
          title: "eCommerce",
          icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
      <path d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.293 2.293c-.63.63-.184 1.707.707 1.707H19M17 21a2 2 0 100-4 2 2 0 000 4zM9 21a2 2 0 100-4 2 2 0 000 4z"></path>
    </svg>`,
          iconGradient: "from-indigo-500 to-blue-500",
          textColor: "text-indigo-400",
          borderColor: "border-indigo-300/30 dark:border-indigo-400/20",
          backgroundGradient: "from-indigo-500/10 via-blue-500/5 to-indigo-600/10",
          roundedClass: "rounded-tl-lg",
          services: [
            { href: "/services/custom-themes", label: "Custom Themes" },
            { href: "/services/custom-apps", label: "Custom Apps" },
            { href: "/services/web-scraping", label: "Web Scraping" }
          ],
          hasSecondarySection: true,
          secondaryTitle: "Web Design & Dev",
          secondaryIcon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
      <line x1="8" y1="21" x2="16" y2="21"></line>
      <line x1="12" y1="17" x2="12" y2="21"></line>
    </svg>`,
          secondaryIconGradient: "from-slate-500 to-gray-500",
          secondaryTextColor: "text-slate-400",
          secondaryServices: [
            { href: "/services/interactive-forms", label: "Interactive Smart Forms" },
            { href: "/services/personalized-recommendations", label: "Personalized Recommendations" },
            { href: "/services/dynamic-pricing", label: "Dynamic Pricing Engine" },
            { href: "/services/smart-search", label: "AI-Powered Search" },
            { href: "/services/behavioral-analytics", label: "Behavioral Analytics" },
            { href: "/services/conversion-optimization", label: "Conversion Optimization" },
            { href: "/services/adaptive-layouts", label: "Adaptive Website Layouts" }
          ]
        },
        // AI Automation Flows
        {
          title: "Automation Flows",
          icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
      <polyline points="7.5,4.21 12,6.81 16.5,4.21"></polyline>
      <polyline points="7.5,19.79 7.5,14.6 3,12"></polyline>
      <polyline points="21,12 16.5,14.6 16.5,19.79"></polyline>
      <polyline points="3.27,6.96 12,12.01 20.73,6.96"></polyline>
      <line x1="12" y1="22.08" x2="12" y2="12"></line>
    </svg>`,
          iconGradient: "from-green-500 to-emerald-500",
          textColor: "text-green-400",
          borderColor: "border-green-300/30 dark:border-green-400/20",
          backgroundGradient: "from-green-500/10 via-emerald-500/5 to-green-600/10",
          services: [
            { href: "/services/workflow-automation", label: "Workflow Automation" },
            { href: "/services/data-entry-automation", label: "Data Entry Automation" },
            { href: "/services/invoice-processing", label: "Invoice Processing" },
            { href: "/services/crm-automation", label: "CRM Automation" },
            { href: "/services/scheduling-automation", label: "Smart Scheduling" },
            { href: "/services/document-processing", label: "Document Processing" },
            { href: "/services/inventory-management", label: "Inventory Management" },
            { href: "/services/expense-tracking", label: "Expense Tracking" },
            { href: "/services/email-automation", label: "Email Workflow Automation" }
          ]
        },
        // AI Sale & Support Agents
        {
          title: "AI Agents",
          icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      <path d="M8 3.13a4 4 0 0 0 0 7.75"></path>
    </svg>`,
          iconGradient: "from-blue-500 to-cyan-500",
          textColor: "text-blue-400",
          borderColor: "border-blue-300/30 dark:border-blue-400/20",
          backgroundGradient: "from-blue-500/10 via-cyan-500/5 to-blue-600/10",
          services: [
            { href: "/services/customer-service-bots", label: "24/7 Customer Service" },
            { href: "/services/sales-agents", label: "AI Sales Agents" },
            { href: "/services/lead-generation-bots", label: "Lead Generation & Follow-Up" },
            { href: "/services/voice-assistants", label: "Voice Assistants" },
            { href: "/services/appointment-booking-bots", label: "Appointment Booking" },
            { href: "/services/ai-phone-agents", label: "Phone Agents" },
            { href: "/services/multilingual-agents", label: "Multilingual Support" },
            { href: "/services/virtual-receptionists", label: "AI Concierge Services" },
            { href: "/services/sales-automation", label: "Sales Automation" }
          ]
        },
        // Photography & Creative Services
        {
          title: "Photography",
          icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
      <circle cx="12" cy="13" r="4"></circle>
    </svg>`,
          iconGradient: "from-rose-500 to-pink-500",
          textColor: "text-rose-400",
          borderColor: "border-rose-300/30 dark:border-rose-400/20",
          backgroundGradient: "from-rose-100/70 via-pink-100/40 to-rose-200/60 dark:from-rose-500/10 dark:via-pink-500/5 dark:to-rose-600/10",
          services: [
            { href: "/services/wedding-photography", label: "Wedding Photography" },
            { href: "/services/portrait-photography", label: "Portrait Photography" },
            { href: "/services/product-photography", label: "Product Photography" },
            { href: "/services/real-estate-photography", label: "Real Estate Photography" }
          ],
          hasSecondarySection: true,
          secondaryTitle: "360\xB0 Services",
          secondaryIcon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
      <circle cx="12" cy="12" r="10"></circle>
      <path d="M8 12h8"></path>
      <path d="M12 8v8"></path>
      <path d="M16.24 7.76l-8.48 8.48"></path>
      <path d="M7.76 7.76l8.48 8.48"></path>
    </svg>`,
          secondaryIconGradient: "from-pink-500 to-rose-500",
          secondaryTextColor: "text-pink-400",
          secondaryServices: [
            { href: "/services/360-videos", label: "360\xB0 Videos" },
            { href: "/services/360-wedding-videos", label: "360\xB0 Wedding Videos" },
            { href: "/services/360-event-videos", label: "360\xB0 Event Videos" },
            { href: "/services/360-photos", label: "360\xB0 Photos" },
            { href: "/services/360-virtual-tours", label: "360\xB0 Virtual Tours" },
            { href: "/services/360-ecommerce-virtual-tours", label: "360\xB0 eCommerce Virtual Tours" }
          ]
        },
        // Combined: Analytics, Content Generation & Training
        {
          title: "Business Analytics",
          icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
      <line x1="18" y1="20" x2="18" y2="10"></line>
      <line x1="12" y1="20" x2="12" y2="4"></line>
      <line x1="6" y1="20" x2="6" y2="14"></line>
    </svg>`,
          iconGradient: "from-orange-500 to-yellow-500",
          textColor: "text-orange-400",
          borderColor: "border-orange-300/30 dark:border-orange-400/20",
          backgroundGradient: "from-orange-500/20 via-purple-500/20 to-teal-500/20",
          roundedClass: "rounded-tr-lg",
          services: [
            { href: "/services/competitor-analysis", label: "Competitor Analysis" },
            { href: "/services/data-visualization", label: "Data Visualization" },
            { href: "/services/operational-analytics", label: "Operational Analytics" }
          ],
          hasSecondarySection: true,
          secondaryTitle: "AI Content Generation",
          secondaryIcon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14,2 14,8 20,8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
    </svg>`,
          secondaryIconGradient: "from-purple-500 to-pink-500",
          secondaryTextColor: "text-purple-400",
          secondaryServices: [
            { href: "/services/ai-product-descriptions", label: "AI Product Descriptions" },
            { href: "/services/ai-product-videos", label: "AI Product Videos" },
            { href: "/services/ai-product-photography", label: "AI Product Photography" }
          ],
          hasThirdSection: true,
          thirdTitle: "Training",
          thirdIcon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>`,
          thirdIconGradient: "from-teal-500 to-cyan-500",
          thirdTextColor: "text-teal-400",
          thirdServices: [
            { href: "/services/ai-training", label: "AI Training" },
            { href: "/services/ai-consulting", label: "AI Consulting" },
            { href: "/services/ai-office-hours", label: "AI Office Hours" }
          ]
        }
      ];
      return renderTemplate`<!-- Service Menus Section -->${maybeRenderHead()}<div class="max-w-[1440px] mx-auto px-4 lg:px-6"> <div class="pt-8 pb-4"> <h3 class="apple-gradient-text text-2xl font-bold text-gray-800 dark:text-white mb-6 text-left transition-colors duration-300">Our Services</h3> </div> <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-0"> ${serviceCategories.map((category, index) => {
        let borderClasses = "border-t border-l";
        if (index === serviceCategories.length - 1) {
          borderClasses = "border-t border-l border-r";
        }
        return renderTemplate`${renderComponent($$result, "ServiceCategory", $$Servicecategory, { ...category, "borderClasses": borderClasses })}`;
      })} </div> </div>`;
    }, "/Volumes/MannyKnows/MK/MannyKnows/src/components/footer/footerservices.astro", void 0);
    $$Astro$7 = createAstro();
    $$Footerbottom = createComponent(($$result, $$props, $$slots) => {
      const Astro2 = $$result.createAstro($$Astro$7, $$props, $$slots);
      Astro2.self = $$Footerbottom;
      const {
        brandName = "MannyKnows.com",
        brandIdentifier = "soyTico\u{1F1E8}\u{1F1F7}\u{1F1FA}\u{1F1F8}",
        currentYear = (/* @__PURE__ */ new Date()).getFullYear(),
        links = {
          sitemap: "/sitemap.xml",
          privacy: "/privacy",
          terms: "/terms"
        }
      } = Astro2.props;
      return renderTemplate`<!-- Footer Bottom -->${maybeRenderHead()}<div class="relative bg-gradient-to-b from-gray-50/95 via-gray-100/90 to-gray-200/95 dark:bg-gradient-to-br dark:from-gray-900 dark:via-slate-800 dark:to-gray-900 dark:animate-gradient-flow border-t border-gray-300/30 dark:border-white/10 transition-colors duration-300 overflow-hidden pb-20 md:pb-6"> <div class="max-w-[1440px] mx-auto px-8 py-6 relative"> <div class="flex flex-col md:flex-row md:justify-between md:items-start gap-4"> <!-- Left Side: Brand Identity --> <div class="flex flex-col gap-1 justify-center md:justify-start"> <div class="flex items-center gap-2 justify-center md:justify-start"> <span class="text-sm font-medium text-gray-700 dark:text-gray-300 transition-all duration-300 apple-gradient-text" data-colorful-title> ${brandName} </span> <span class="text-xs text-gray-600 dark:text-gray-400 opacity-80 transition-opacity duration-300"> <span class="border-l border-gray-400/30 dark:border-white/20 pl-2 ml-1"> ${brandIdentifier} </span> </span> </div> <!-- Cherry Vibes LLC --> <div class="text-xs text-center md:text-left"> <span class="text-gray-600 dark:text-gray-400 opacity-70 transition-opacity duration-300">
Cherry Vibes LLC, MA
</span> </div> </div> <!-- Right Side: Menu and Copyright --> <div class="flex flex-col gap-2 text-sm md:text-right"> <!-- Menu Links --> <div class="flex gap-6 justify-center md:justify-end"> <a${addAttribute(links.sitemap, "href")} class="text-gray-800 dark:text-white/60 transition-all duration-300 apple-gradient-text hover:opacity-80">
Sitemap
</a> <a${addAttribute(links.privacy, "href")} class="text-gray-800 dark:text-white/60 transition-all duration-300 apple-gradient-text hover:opacity-80">
Privacy
</a> <a${addAttribute(links.terms, "href")} class="text-gray-800 dark:text-white/60 transition-all duration-300 apple-gradient-text hover:opacity-80">
Terms
</a> </div> <!-- Copyright --> <div class="text-xs text-center md:text-right"> <span class="text-gray-700 dark:text-white/50 transition-colors duration-300">
All rights reserved © ${currentYear} </span> </div> </div> </div> </div> </div>`;
    }, "/Volumes/MannyKnows/MK/MannyKnows/src/components/footer/footerbottom.astro", void 0);
    $$Astro$6 = createAstro();
    $$FooterMain = createComponent(($$result, $$props, $$slots) => {
      const Astro2 = $$result.createAstro($$Astro$6, $$props, $$slots);
      Astro2.self = $$FooterMain;
      const props = Astro2.props;
      return renderTemplate`${maybeRenderHead()}<footer class="relative bg-gradient-to-b from-gray-100/95 via-gray-150/90 to-gray-100/95 dark:bg-gradient-to-br dark:from-gray-900 dark:via-slate-800 dark:to-gray-900 dark:animate-gradient-flow border-t border-gray-300/50 dark:border-white/10 transition-colors duration-300"> <!-- Gradient border that fades to transparent --> <div class="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-blue to-transparent animate-gradient-slide"></div> <div class="absolute inset-0 bg-gradient-to-br from-gray-50/60 via-gray-100/40 to-gray-50/60 dark:from-slate-900/60 dark:via-gray-800/40 dark:to-slate-900/60 -z-10 transition-colors duration-300"></div> <!-- Header Section: Brand, Social, Blog Articles, Newsletter --> ${renderComponent($$result, "FooterHeader", $$Footerheader, { ...props })} <!-- Services Section --> ${renderComponent($$result, "FooterServices", $$Footerservices, {})} </footer> <!-- Footer Bottom --> ${renderComponent($$result, "FooterBottom", $$Footerbottom, { ...props })}`;
    }, "/Volumes/MannyKnows/MK/MannyKnows/src/components/footer/FooterMain.astro", void 0);
    __freeze$2 = Object.freeze;
    __defProp$2 = Object.defineProperty;
    __template$2 = /* @__PURE__ */ __name((cooked, raw) => __freeze$2(__defProp$2(cooked, "raw", { value: __freeze$2(cooked.slice()) })), "__template$2");
    $$Astro$5 = createAstro();
    $$GoogleAnalytics = createComponent(($$result, $$props, $$slots) => {
      const Astro2 = $$result.createAstro($$Astro$5, $$props, $$slots);
      Astro2.self = $$GoogleAnalytics;
      const {
        measurementId = "G-J0V35RZNZB",
        enableInDev = false
      } = Astro2.props;
      return renderTemplate`${renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": /* @__PURE__ */ __name(($$result2) => renderTemplate(_a$2 || (_a$2 = __template$2(["<script async", "><\/script><script>(function(){", "\n      window.dataLayer = window.dataLayer || [];\n      function gtag(){dataLayer.push(arguments);}\n      gtag('js', new Date());\n\n      gtag('config', measurementId);\n    })();<\/script>"])), addAttribute(`https://www.googletagmanager.com/gtag/js?id=${measurementId}`, "src"), defineScriptVars({ measurementId })), "default") })}`}`;
    }, "/Volumes/MannyKnows/MK/MannyKnows/src/components/analytics/GoogleAnalytics.astro", void 0);
    __freeze$1 = Object.freeze;
    __defProp$1 = Object.defineProperty;
    __template$1 = /* @__PURE__ */ __name((cooked, raw) => __freeze$1(__defProp$1(cooked, "raw", { value: __freeze$1(cooked.slice()) })), "__template$1");
    $$Astro$4 = createAstro();
    $$BaseLayout = createComponent(($$result, $$props, $$slots) => {
      const Astro2 = $$result.createAstro($$Astro$4, $$props, $$slots);
      Astro2.self = $$BaseLayout;
      const { title: title2 } = Astro2.props;
      return renderTemplate(_a$1 || (_a$1 = __template$1(['<html lang="en"> <head><meta charset="UTF-8"><meta name="description" content="MannyKnows - Professional AI-powered business solutions. Transform your business with intelligent automation, data-driven insights, and cutting-edge AI services."><meta name="viewport" content="width=device-width, initial-scale=1.0"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><meta name="generator"', `><!-- Security Headers --><meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://meet.jit.si; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://api.openai.com https://api.resend.com https://meet.jit.si; frame-src 'self' https://meet.jit.si; media-src 'self' https: blob:;"><meta http-equiv="X-Content-Type-Options" content="nosniff"><meta http-equiv="X-Frame-Options" content="SAMEORIGIN"><meta http-equiv="Strict-Transport-Security" content="max-age=31536000; includeSubDomains"><meta name="referrer" content="strict-origin-when-cross-origin"><!-- PERFORMANCE: Resource hints for faster loading --><link rel="dns-prefetch" href="//www.googletagmanager.com"><link rel="dns-prefetch" href="//fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><!-- OPTIMIZED: System fonts with Inter fallback (swap for better performance) --><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" rel="stylesheet"><!-- Google Analytics -->`, "<!-- DEFERRED: Load pixel canvas after critical resources -->", "<title>", "</title><!-- CRITICAL: Theme initialization script - must run before body to prevent FOUC --><script>\n			// Initialize theme immediately to prevent flash of unstyled content\n			(function() {\n				function getInitialTheme() {\n					try {\n						// Check if user has explicitly set a preference\n						const stored = localStorage.getItem('theme-dark');\n						if (stored !== null) {\n							return stored !== 'false';\n						}\n						\n						// Default to dark mode by design (instead of system preference)\n						return true;\n					} catch (error) {\n						// Handle localStorage errors (private browsing, etc.)\n						// Default to dark mode by design\n						return true;\n					}\n				}\n				\n				const isDark = getInitialTheme();\n				document.documentElement.classList.toggle('dark', isDark);\n				\n				// Store the resolved preference for consistency\n				try {\n					if (localStorage.getItem('theme-dark') === null) {\n						localStorage.setItem('theme-dark', isDark.toString());\n					}\n				} catch (error) {\n					// Silently fail if localStorage is unavailable\n				}\n			})();\n		<\/script>", "</head> <body> <!-- Settings Modal --> ", " ", " ", " </body></html>"])), addAttribute(Astro2.generator, "content"), renderComponent($$result, "GoogleAnalytics", $$GoogleAnalytics, {}), renderScript($$result, "/Volumes/MannyKnows/MK/MannyKnows/src/layouts/BaseLayout.astro?astro&type=script&index=0&lang.ts"), title2, renderHead(), renderComponent($$result, "SettingsModal", $$Settingsmodal, {}), renderSlot($$result, $$slots["default"]), renderComponent($$result, "FooterMain", $$FooterMain, {}));
    }, "/Volumes/MannyKnows/MK/MannyKnows/src/layouts/BaseLayout.astro", void 0);
    $$MarqueeSimple = createComponent(($$result, $$props, $$slots) => {
      return renderTemplate`${maybeRenderHead()}<div class="h-[50px] bg-gradient-to-r from-primary-blue via-purple-500 to-primary-pink overflow-hidden relative flex items-center z-10 animate-button-gradient" data-marquee data-astro-cid-qqmjog6h> <div class="flex whitespace-nowrap animate-scroll" data-astro-cid-qqmjog6h> <div class="flex items-center gap-2 text-white text-sm font-medium whitespace-nowrap px-8" data-astro-cid-qqmjog6h> <strong class="font-bold" data-astro-cid-qqmjog6h>🚀 New Launch</strong> <span data-astro-cid-qqmjog6h>Get your free e-commerce store audit - Limited time offer!</span> </div> <div class="flex items-center gap-2 text-white text-sm font-medium whitespace-nowrap px-8" data-astro-cid-qqmjog6h> <strong class="font-bold" data-astro-cid-qqmjog6h>📈 Revenue Growth</strong> <span data-astro-cid-qqmjog6h>AI solutions that increase e-commerce sales by 40%</span> </div> <div class="flex items-center gap-2 text-white text-sm font-medium whitespace-nowrap px-8" data-astro-cid-qqmjog6h> <strong class="font-bold" data-astro-cid-qqmjog6h>🎯 Results Driven</strong> <span data-astro-cid-qqmjog6h>Join 200+ e-commerce store owners who trust MannyKnows</span> </div> <div class="flex items-center gap-2 text-white text-sm font-medium whitespace-nowrap px-8" data-astro-cid-qqmjog6h> <strong class="font-bold" data-astro-cid-qqmjog6h>💎 Fast Implementation</strong> <span data-astro-cid-qqmjog6h>E-commerce solutions delivered in 2-4 weeks</span> </div> <div class="flex items-center gap-2 text-white text-sm font-medium whitespace-nowrap px-8" data-astro-cid-qqmjog6h> <strong class="font-bold" data-astro-cid-qqmjog6h>💪 Satisfaction</strong> <span data-astro-cid-qqmjog6h>100% money-back guarantee on all store solutions</span> </div> <!-- Duplicate for seamless loop --> <div class="flex items-center gap-2 text-white text-sm font-medium whitespace-nowrap px-8" data-astro-cid-qqmjog6h> <strong class="font-bold" data-astro-cid-qqmjog6h>🚀 New Launch</strong> <span data-astro-cid-qqmjog6h>Get your free e-commerce store audit - Limited time offer!</span> </div> <div class="flex items-center gap-2 text-white text-sm font-medium whitespace-nowrap px-8" data-astro-cid-qqmjog6h> <strong class="font-bold" data-astro-cid-qqmjog6h>📈 Revenue Growth</strong> <span data-astro-cid-qqmjog6h>AI solutions that increase e-commerce sales by 40%</span> </div> <div class="flex items-center gap-2 text-white text-sm font-medium whitespace-nowrap px-8" data-astro-cid-qqmjog6h> <strong class="font-bold" data-astro-cid-qqmjog6h>🎯 Results Driven</strong> <span data-astro-cid-qqmjog6h>Join 200+ e-commerce store owners who trust MannyKnows</span> </div> <div class="flex items-center gap-2 text-white text-sm font-medium whitespace-nowrap px-8" data-astro-cid-qqmjog6h> <strong class="font-bold" data-astro-cid-qqmjog6h>💎 Fast Implementation</strong> <span data-astro-cid-qqmjog6h>E-commerce solutions delivered in 2-4 weeks</span> </div> <div class="flex items-center gap-2 text-white text-sm font-medium whitespace-nowrap px-8" data-astro-cid-qqmjog6h> <strong class="font-bold" data-astro-cid-qqmjog6h>💪 Satisfaction</strong> <span data-astro-cid-qqmjog6h>100% money-back guarantee on all store solutions</span> </div> </div> </div> `;
    }, "/Volumes/MannyKnows/MK/MannyKnows/src/components/MarqueeSimple.astro", void 0);
    $$Astro$3 = createAstro();
    $$Button = createComponent(($$result, $$props, $$slots) => {
      const Astro2 = $$result.createAstro($$Astro$3, $$props, $$slots);
      Astro2.self = $$Button;
      const {
        href,
        text,
        subtext,
        id,
        variant = "primary",
        size = "md",
        icon,
        arrow = false,
        emoji,
        emojiAnimation = "normal",
        sparkles = true,
        sparkleTheme = "light",
        pixelColors,
        className = "",
        yellowText = false
      } = Astro2.props;
      const sizeClasses = {
        sm: "py-2 px-4 text-sm h-10",
        md: "py-3 px-6 text-sm h-12",
        lg: "py-4 px-8 text-lg h-14"
      };
      const variantClasses = {
        primary: "bg-gradient-to-r from-primary-blue via-purple-500 to-primary-pink text-white shadow-lg shadow-primary-blue/40",
        apple: "bg-gradient-to-r from-[#0071e3] via-[#ff4faa] to-[#10d1ff] text-white shadow-lg shadow-blue-500/40",
        green: "bg-gradient-to-r from-green-400 via-emerald-500 to-green-600 text-white shadow-lg shadow-green-500/40",
        urgent: "bg-red-500 text-white animate-pulse shadow-xl shadow-red-500/60 border-4 border-yellow-400",
        emoji: "bg-gradient-to-r from-primary-blue via-purple-500 to-primary-pink text-white shadow-lg shadow-primary-blue/40",
        cta: "bg-gradient-to-r from-primary-blue via-purple-500 to-primary-pink text-white py-4 px-8 rounded-xl text-lg hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(16,209,255,0.3)] animate-button-gradient",
        "theme-aware": ""
        // Special handling below
      };
      const sparkleThemes = {
        light: "#ffffff, #f8fafc, #e2e8f0",
        dark: "#000000, #1f2937, #374151",
        blue: "#6366f1, #3b82f6, #4f46e5",
        green: "#22c55e, #10b981, #16a34a",
        orange: "#f97316, #eab308, #ea580c",
        purple: "#a855f7, #ec4899, #9333ea",
        cyan: "#14b8a6, #06b6d4, #0d9488",
        none: ""
      };
      const finalSparkleColors = !sparkles || variant === "cta" ? "" : pixelColors !== void 0 ? pixelColors : sparkleThemes[sparkleTheme];
      const isThemeAware = variant === "theme-aware";
      const themeAwareClasses = {
        light: "bg-white border border-black/20 text-black",
        dark: "bg-black border border-white/20 text-white"
      };
      const themeAwareSparkles = {
        light: "#000000, #1f2937, #374151",
        dark: "#ffffff, #f8fafc, #e2e8f0"
      };
      const sizeClass = variant === "cta" ? "" : sizeClasses[size];
      const borderRadius = variant === "cta" ? "" : "rounded-lg";
      const hoverTransform = variant === "cta" ? "" : "hover:scale-105 hover:-translate-y-0.5";
      const flexType = variant === "cta" ? "inline-flex" : "flex";
      const baseClasses = `${sizeClass} ${borderRadius} no-underline font-semibold ${flexType} items-center justify-center relative transition-all duration-300 ${hoverTransform} group`;
      return renderTemplate`${isThemeAware ? renderTemplate`<!-- Theme-Aware Button: Two versions for light/dark modes -->
  ${renderComponent($$result, "Fragment", Fragment, { "data-astro-cid-5mihwmm4": true }, { "default": /* @__PURE__ */ __name(($$result2) => renderTemplate`${maybeRenderHead()}<a${addAttribute(href, "href")}${addAttribute(id ? `${id}-light` : void 0, "id")}${addAttribute(`light-mode-only ${themeAwareClasses.light} ${baseClasses} overflow-hidden before:content-[''] before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/8 before:to-transparent before:-translate-x-full before:animate-subtle-shimmer ${className}`, "class")} data-astro-cid-5mihwmm4>${sparkles && renderTemplate`${renderComponent($$result2, "pixel-canvas", "pixel-canvas", { "data-colors": finalSparkleColors || themeAwareSparkles.light, "data-gap": "35", "data-speed": "60", "data-no-focus": true, "style": "position: absolute; inset: 0; z-index: 1; pointer-events: none; opacity: 0.9 !important;", "data-astro-cid-5mihwmm4": true })}`}<div class="relative z-10 flex flex-col items-center" data-astro-cid-5mihwmm4><span class="font-semibold relative z-10" data-astro-cid-5mihwmm4>${text}</span>${subtext && renderTemplate`<span class="text-[10px] opacity-80 leading-none relative z-10" data-astro-cid-5mihwmm4>${subtext}</span>`}</div></a><a${addAttribute(href, "href")}${addAttribute(id ? `${id}-dark` : void 0, "id")}${addAttribute(`dark-mode-only ${themeAwareClasses.dark} ${baseClasses} overflow-hidden before:content-[''] before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/8 before:to-transparent before:-translate-x-full before:animate-subtle-shimmer ${className}`, "class")} data-astro-cid-5mihwmm4>${sparkles && renderTemplate`${renderComponent($$result2, "pixel-canvas", "pixel-canvas", { "data-colors": finalSparkleColors || themeAwareSparkles.dark, "data-gap": "20", "data-speed": "40", "data-no-focus": true, "style": "position: absolute; inset: 0; z-index: 1; pointer-events: none; opacity: 0.9 !important;", "data-astro-cid-5mihwmm4": true })}`}<div class="relative z-10 flex flex-col items-center" data-astro-cid-5mihwmm4><span class="font-semibold relative z-10" data-astro-cid-5mihwmm4>${text}</span>${subtext && renderTemplate`<span class="text-[10px] opacity-80 leading-none relative z-10" data-astro-cid-5mihwmm4>${subtext}</span>`}</div></a>`, "default") })}` : renderTemplate`<!-- Regular Button: Single version with variant styling -->
  <a${addAttribute(href, "href")}${addAttribute(id, "id")}${addAttribute(`${variantClasses[variant]} ${baseClasses} ${className}`, "class")} data-astro-cid-5mihwmm4>${finalSparkleColors && variant !== "cta" && renderTemplate`${renderComponent($$result, "pixel-canvas", "pixel-canvas", { "data-colors": finalSparkleColors, "data-gap": "4", "data-speed": "35", "data-no-focus": true, "style": "position: absolute; inset: 0; z-index: 1; pointer-events: none; border-radius: inherit; overflow: hidden;", "data-astro-cid-5mihwmm4": true })}`}<span${addAttribute(`relative z-10 flex items-center ${variant === "cta" ? "gap-3" : "gap-2"}`, "class")} data-astro-cid-5mihwmm4>${icon && renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": /* @__PURE__ */ __name(($$result2) => renderTemplate`${unescapeHTML(icon)}`, "default") })}`}${variant === "cta" ? renderTemplate`${renderComponent($$result, "Fragment", Fragment, { "data-astro-cid-5mihwmm4": true }, { "default": /* @__PURE__ */ __name(($$result2) => renderTemplate`<span data-astro-cid-5mihwmm4>${text}</span>${arrow && renderTemplate`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-astro-cid-5mihwmm4><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" data-astro-cid-5mihwmm4></path></svg>`}`, "default") })}` : renderTemplate`<div class="flex flex-col items-center" data-astro-cid-5mihwmm4><span${addAttribute(`font-semibold leading-tight transition-all duration-300 hover:drop-shadow-lg ${variant === "emoji" ? "group-hover:text-yellow-300" : ""}`, "class")} data-astro-cid-5mihwmm4>${text}</span>${subtext && renderTemplate`<span${addAttribute(`text-[10px] opacity-80 leading-tight transition-all duration-300 hover:drop-shadow-md ${variant === "emoji" ? "group-hover:text-yellow-200" : ""}`, "class")} data-astro-cid-5mihwmm4>${subtext}</span>`}</div>`}</span>${emoji && variant === "emoji" && renderTemplate`<span${addAttribute(`absolute top-1/2 right-0 text-2xl flex items-center justify-center z-20 opacity-100 transition-all duration-300 transform translate-x-1 -translate-y-1/2 animate-emoji-sway`, "class")}${addAttribute(`--sway-intensity: ${emojiAnimation === "subtle" ? "0.3" : emojiAnimation === "normal" ? "1" : emojiAnimation === "dramatic" ? "2" : "3"};`, "style")} data-astro-cid-5mihwmm4>${emoji}</span>`}</a>`}`;
    }, "/Volumes/MannyKnows/MK/MannyKnows/src/components/ui/button.astro", void 0);
    __freeze = Object.freeze;
    __defProp2 = Object.defineProperty;
    __template = /* @__PURE__ */ __name((cooked, raw) => __freeze(__defProp2(cooked, "raw", { value: __freeze(raw || cooked.slice()) })), "__template");
    $$Astro$2 = createAstro();
    $$NavBar = createComponent(($$result, $$props, $$slots) => {
      const Astro2 = $$result.createAstro($$Astro$2, $$props, $$slots);
      Astro2.self = $$NavBar;
      const {
        className = "",
        animationConfig = {
          searchGradientEnabled: true,
          debugMode: false,
          searchScrollDelay: 0
        }
      } = Astro2.props;
      const navLinks = [
        { href: "#services", label: "Services" },
        { href: "#products", label: "Products" },
        { href: "#process", label: "Process" },
        { href: "#reviews", label: "Reviews" }
      ];
      return renderTemplate(_a || (_a = __template(["", '<nav id="topNav"', ` data-astro-cid-jvr44bst> <div class="max-w-[1440px] mx-auto px-2 w-full" data-astro-cid-jvr44bst> <!-- Desktop Layout --> <div class="hidden xl:flex justify-between items-center w-full" data-astro-cid-jvr44bst> <!-- Logo --> <h1 class="text-5xl font-black m-0" data-astro-cid-jvr44bst> <a href="/" class="logo-gradient text-text-light-primary dark:text-text-dark-primary font-black transition-all duration-500 no-underline relative overflow-hidden before:content-[''] before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/6 before:to-transparent before:-translate-x-full before:animate-subtle-shimmer before:pointer-events-none" data-astro-cid-jvr44bst>
MK
</a> </h1> <!-- Navigation Menu --> <ul class="flex list-none gap-8 m-0 p-0 flex-1 justify-center ml-8" data-astro-cid-jvr44bst> `, ' </ul> <!-- Search Bar --> <div class="relative flex items-center flex-1 mx-4" data-astro-cid-jvr44bst> <label for="search-input" class="absolute -left-[10000px] opacity-0 pointer-events-none" data-astro-cid-jvr44bst>Browse Services Catalog</label> <input id="search-input" type="search" placeholder="Browse services catalog..." class="bg-black/10 dark:bg-white/10 border border-border-light dark:border-border-dark rounded-lg py-3 pl-4 pr-10 text-text-light-primary dark:text-text-dark-primary text-sm w-full h-12 transition-all duration-300 backdrop-blur-lg placeholder:text-text-light-tertiary dark:placeholder:text-text-dark-tertiary focus:outline-none focus:border-primary-blue/50 focus:bg-black/20 dark:focus:bg-white/20 focus:shadow-[0_0_0_2px_rgba(16,209,255,0.2)]" data-astro-cid-jvr44bst> <button type="button" class="absolute right-2 bg-none border-none text-text-light-tertiary dark:text-text-dark-tertiary cursor-pointer p-1 rounded transition-colors duration-300 flex items-center justify-center hover:text-text-light-primary dark:hover:text-text-dark-primary" aria-label="AI Search" data-astro-cid-jvr44bst> <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" data-astro-cid-jvr44bst> <path d="M12 0l1.5 4.5L18 6l-4.5 1.5L12 12l-1.5-4.5L6 6l4.5-1.5L12 0z" data-astro-cid-jvr44bst></path> <path d="M20 8l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" data-astro-cid-jvr44bst></path> <path d="M4 16l0.8 2.4L7.2 19.2l-2.4 0.8L4 22.4l-0.8-2.4L0.8 19.2l2.4-0.8L4 16z" data-astro-cid-jvr44bst></path> </svg> </button> </div> <!-- Navigation Actions --> <div class="flex items-center gap-2 relative" data-astro-cid-jvr44bst> ', " ", ` <button type="button" class="group bg-gradient-to-br from-green-500 via-emerald-500 to-green-600 bg-200 border border-green-400/30 rounded-lg text-white w-12 h-12 flex items-center justify-center cursor-pointer transition-all duration-300 relative overflow-hidden hover:scale-105 hover:shadow-[0_8px_25px_rgba(34,197,94,0.4)] animate-green-gradient-flow before:content-[''] before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/8 before:to-transparent before:-translate-x-full before:animate-green-shimmer" id="topChatToggle" data-astro-cid-jvr44bst> <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="relative z-10" data-astro-cid-jvr44bst> <path d="M12 8V4H8" data-astro-cid-jvr44bst></path> <rect width="16" height="12" x="4" y="8" rx="2" data-astro-cid-jvr44bst></rect> <path d="M2 14h2" data-astro-cid-jvr44bst></path> <path d="M20 14h2" data-astro-cid-jvr44bst></path> <path d="M15 13v2" data-astro-cid-jvr44bst></path> <path d="M9 13v2" data-astro-cid-jvr44bst></path> </svg> <!-- Tooltip --> <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black dark:bg-white text-white dark:text-black text-sm whitespace-nowrap rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-lg pointer-events-none" role="tooltip" data-astro-cid-jvr44bst>
Talk to Us
</div> </button> </div> </div> <!-- Mobile Layout --> <div class="flex xl:hidden items-center w-full h-16 px-0" data-astro-cid-jvr44bst> <!-- Logo - 15% --> <div class="flex-[0_0_15%] flex items-center" data-astro-cid-jvr44bst> <h1 class="text-3xl font-black m-0 leading-none" data-astro-cid-jvr44bst> <a href="/" class="logo-gradient text-text-light-primary dark:text-text-dark-primary font-black transition-all duration-500 no-underline relative overflow-hidden before:content-[''] before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/6 before:to-transparent before:-translate-x-full before:animate-subtle-shimmer before:pointer-events-none" data-astro-cid-jvr44bst>
MK
</a> </h1> </div> <!-- Search Bar - 70% --> <div class="flex-[0_0_70%] flex items-center px-2" data-astro-cid-jvr44bst> <div class="relative flex items-center w-full" data-astro-cid-jvr44bst> <label for="search-input-mobile" class="absolute -left-[10000px] opacity-0 pointer-events-none" data-astro-cid-jvr44bst>Browse Services Catalog</label> <input id="search-input-mobile" type="search" placeholder="Browse services catalog..." class="bg-black/10 dark:bg-white/10 border border-border-light dark:border-border-dark rounded-lg py-2 pl-3 pr-8 text-text-light-primary dark:text-text-dark-primary text-sm w-full h-10 transition-all duration-300 backdrop-blur-lg placeholder:text-text-light-tertiary dark:placeholder:text-text-dark-tertiary focus:outline-none focus:border-primary-blue/50 focus:bg-black/20 dark:focus:bg-white/20 focus:shadow-[0_0_0_2px_rgba(16,209,255,0.2)]" data-astro-cid-jvr44bst> <button type="button" class="absolute right-2 bg-none border-none text-text-light-tertiary dark:text-text-dark-tertiary cursor-pointer p-1 rounded transition-colors duration-300 flex items-center justify-center h-6 w-6 hover:text-text-light-primary dark:hover:text-text-dark-primary" aria-label="AI Search" data-astro-cid-jvr44bst> <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" data-astro-cid-jvr44bst> <path d="M12 0l1.5 4.5L18 6l-4.5 1.5L12 12l-1.5-4.5L6 6l4.5-1.5L12 0z" data-astro-cid-jvr44bst></path> <path d="M20 8l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" data-astro-cid-jvr44bst></path> <path d="M4 16l0.8 2.4L7.2 19.2l-2.4 0.8L4 22.4l-0.8-2.4L0.8 19.2l2.4-0.8L4 16z" data-astro-cid-jvr44bst></path> </svg> </button> </div> </div> <!-- Hamburger Menu - 15% --> <div class="flex-[0_0_15%] flex justify-center items-center" data-astro-cid-jvr44bst> <button type="button" id="mobile-menu-toggle" class="p-2 rounded-lg text-text-light-primary dark:text-text-dark-primary hover:bg-black/10 dark:hover:bg-white/10 transition-colors duration-300 flex items-center justify-center" aria-label="Toggle mobile menu" aria-expanded="false" data-astro-cid-jvr44bst> <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="hamburger-icon" data-astro-cid-jvr44bst> <line x1="3" y1="6" x2="21" y2="6" data-astro-cid-jvr44bst></line> <line x1="3" y1="12" x2="21" y2="12" data-astro-cid-jvr44bst></line> <line x1="3" y1="18" x2="21" y2="18" data-astro-cid-jvr44bst></line> </svg> <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="close-icon hidden" data-astro-cid-jvr44bst> <line x1="18" y1="6" x2="6" y2="18" data-astro-cid-jvr44bst></line> <line x1="6" y1="6" x2="18" y2="18" data-astro-cid-jvr44bst></line> </svg> </button> </div> </div> </div> <!-- Mobile Menu Overlay --> <div id="mobile-menu" class="fixed inset-0 z-50 xl:hidden transform translate-x-full transition-transform duration-300 ease-in-out" data-astro-cid-jvr44bst> <!-- Light Glassmorphism Background --> <div id="mobile-menu-backdrop" class="absolute inset-0 bg-white/20 dark:bg-gray-900/25 backdrop-blur-xl" data-astro-cid-jvr44bst></div> <!-- Menu Content --> <div class="relative h-full w-[95%] ml-auto flex flex-col bg-white/90 dark:bg-gray-900/85 backdrop-blur-xl border-l border-gray-300/30 dark:border-white/20 shadow-xl" data-astro-cid-jvr44bst> <!-- Header with Close Button --> <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700" data-astro-cid-jvr44bst> <h2 class="text-xl font-semibold text-text-light-primary dark:text-text-dark-primary" data-astro-cid-jvr44bst>Menu</h2> <button type="button" id="mobile-menu-close" class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200" aria-label="Close mobile menu" data-astro-cid-jvr44bst> <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-text-light-primary dark:text-text-dark-primary" data-astro-cid-jvr44bst> <line x1="18" y1="6" x2="6" y2="18" data-astro-cid-jvr44bst></line> <line x1="6" y1="6" x2="18" y2="18" data-astro-cid-jvr44bst></line> </svg> </button> </div> <!-- Navigation Links --> <div class="px-4 py-4 space-y-2" data-astro-cid-jvr44bst> `, ' </div> <!-- Action Buttons --> <div class="p-6 border-t border-gray-200 dark:border-gray-700 space-y-3" data-astro-cid-jvr44bst> <div class="flex gap-3" data-astro-cid-jvr44bst> ', " ", ' </div> <!-- Settings Section --> <div class="mt-6" data-astro-cid-jvr44bst> <!-- Settings Toggle Button --> <button type="button" id="mobileSettingsToggle" class="group w-full p-3 bg-gray-100/50 dark:bg-gray-800/50 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 transition-all duration-200 flex items-center justify-between" data-astro-cid-jvr44bst> <div class="flex items-center gap-3" data-astro-cid-jvr44bst> <!-- User Preferences Icon --> <svg class="w-5 h-5 text-gray-600 dark:text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-astro-cid-jvr44bst> <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" data-astro-cid-jvr44bst></path> <circle cx="12" cy="7" r="4" data-astro-cid-jvr44bst></circle> </svg> <span class="text-gray-700 dark:text-gray-300 font-medium" data-astro-cid-jvr44bst>User preferences</span> </div> <svg class="w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200" id="settingsChevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-astro-cid-jvr44bst> <polyline points="6,9 12,15 18,9" data-astro-cid-jvr44bst></polyline> </svg> </button> <!-- Inline Settings Panel --> <div id="mobileSettingsPanel" class="hidden mt-2 p-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg border border-gray-200/50 dark:border-gray-600/50 space-y-3" data-astro-cid-jvr44bst> <!-- Theme Setting --> <div class="flex items-center justify-between" data-astro-cid-jvr44bst> <div class="flex items-center gap-2" data-astro-cid-jvr44bst> <div class="w-6 h-6 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-md flex items-center justify-center" data-astro-cid-jvr44bst> <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-blue-600 dark:text-blue-400" data-astro-cid-jvr44bst> <circle cx="12" cy="12" r="5" data-astro-cid-jvr44bst></circle> <line x1="12" y1="1" x2="12" y2="3" data-astro-cid-jvr44bst></line> <line x1="12" y1="21" x2="12" y2="23" data-astro-cid-jvr44bst></line> <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" data-astro-cid-jvr44bst></line> <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" data-astro-cid-jvr44bst></line> <line x1="1" y1="12" x2="3" y2="12" data-astro-cid-jvr44bst></line> <line x1="21" y1="12" x2="23" y2="12" data-astro-cid-jvr44bst></line> <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" data-astro-cid-jvr44bst></line> <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" data-astro-cid-jvr44bst></line> </svg> </div> <div data-astro-cid-jvr44bst> <div class="text-sm font-medium text-gray-800 dark:text-white" data-astro-cid-jvr44bst>Theme</div> <div class="text-xs text-gray-600 dark:text-gray-400" data-astro-cid-jvr44bst>Light/Dark mode</div> </div> </div> <label class="relative inline-flex items-center cursor-pointer" data-astro-cid-jvr44bst> <input type="checkbox" id="mobileThemeToggle" class="sr-only peer" checked data-astro-cid-jvr44bst> <!-- Modern iOS-style toggle switch with sliding handle --> <div class="relative w-10 h-5 bg-gray-200 dark:bg-gray-700 rounded-full peer-focus:ring-2 peer-focus:ring-blue-300/30 dark:peer-focus:ring-blue-800/30 transition-all duration-300 peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-indigo-600 shadow-inner" data-astro-cid-jvr44bst></div> <!-- Sliding toggle handle - direct sibling for peer-checked to work --> <div class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-lg transform transition-transform duration-300 peer-checked:translate-x-5 flex items-center justify-center" data-astro-cid-jvr44bst> <!-- Light mode icon (sun) - visible when NOT checked (light mode) --> <svg class="absolute w-3 h-3 text-yellow-500 transition-opacity duration-200 opacity-100 peer-checked:opacity-0" viewBox="0 0 20 20" fill="currentColor" data-astro-cid-jvr44bst> <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd" data-astro-cid-jvr44bst></path> </svg> <!-- Dark mode icon (moon) - visible when checked (dark mode) --> <svg class="absolute w-3 h-3 text-slate-700 transition-opacity duration-200 opacity-0 peer-checked:opacity-100" viewBox="0 0 20 20" fill="currentColor" data-astro-cid-jvr44bst> <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" data-astro-cid-jvr44bst></path> </svg> </div> </label></div> <!-- Marquee Setting --> <div class="flex items-center justify-between" data-astro-cid-jvr44bst> <div class="flex items-center gap-2" data-astro-cid-jvr44bst> <div class="w-6 h-6 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-md flex items-center justify-center" data-astro-cid-jvr44bst> <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-green-600 dark:text-green-400" data-astro-cid-jvr44bst> <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z" data-astro-cid-jvr44bst></path> <path d="M8 21l4-7 4 7M13 10V7" data-astro-cid-jvr44bst></path> </svg> </div> <div data-astro-cid-jvr44bst> <div class="text-sm font-medium text-gray-800 dark:text-white" data-astro-cid-jvr44bst>Marquee</div> <div class="text-xs text-gray-600 dark:text-gray-400" data-astro-cid-jvr44bst>Animated text banner</div> </div> </div> <label class="relative inline-flex items-center cursor-pointer" data-astro-cid-jvr44bst> <input type="checkbox" id="mobileMarqueeToggle" class="sr-only peer" checked data-astro-cid-jvr44bst> <div class="relative w-10 h-5 bg-gray-200 dark:bg-gray-700 rounded-full peer-focus:ring-2 peer-focus:ring-green-300/30 dark:peer-focus:ring-green-800/30 transition-all duration-300 peer-checked:bg-gradient-to-r peer-checked:from-green-500 peer-checked:to-emerald-600 shadow-inner" data-astro-cid-jvr44bst></div> <div class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-lg transform transition-transform duration-300 peer-checked:translate-x-5 flex items-center justify-center" data-astro-cid-jvr44bst> <!-- Hide icon (eye-slash) - visible when NOT checked --> <svg class="absolute w-3 h-3 text-gray-500 transition-opacity duration-200 opacity-100 peer-checked:opacity-0" viewBox="0 0 20 20" fill="currentColor" data-astro-cid-jvr44bst> <path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clip-rule="evenodd" data-astro-cid-jvr44bst></path> <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" data-astro-cid-jvr44bst></path> </svg> <!-- Show icon (eye) - visible when checked --> <svg class="absolute w-3 h-3 text-green-600 transition-opacity duration-200 opacity-0 peer-checked:opacity-100" viewBox="0 0 20 20" fill="currentColor" data-astro-cid-jvr44bst> <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" data-astro-cid-jvr44bst></path> <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" data-astro-cid-jvr44bst></path> </svg> </div> </label> </div> <!-- Colorful Titles Setting --> <div class="flex items-center justify-between" data-astro-cid-jvr44bst> <div class="flex items-center gap-2" data-astro-cid-jvr44bst> <div class="w-6 h-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-md flex items-center justify-center" data-astro-cid-jvr44bst> <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-purple-600 dark:text-purple-400" data-astro-cid-jvr44bst> <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" data-astro-cid-jvr44bst></path> </svg> </div> <div data-astro-cid-jvr44bst> <div class="text-sm font-medium text-gray-800 dark:text-white" data-astro-cid-jvr44bst>Colorful Titles</div> <div class="text-xs text-gray-600 dark:text-gray-400" data-astro-cid-jvr44bst>Gradient text effects</div> </div> </div> <label class="relative inline-flex items-center cursor-pointer" data-astro-cid-jvr44bst> <input type="checkbox" id="mobileColorfulTitlesToggle" class="sr-only peer" checked data-astro-cid-jvr44bst> <div class="relative w-10 h-5 bg-gray-200 dark:bg-gray-700 rounded-full peer-focus:ring-2 peer-focus:ring-purple-300/30 dark:peer-focus:ring-purple-800/30 transition-all duration-300 peer-checked:bg-gradient-to-r peer-checked:from-purple-500 peer-checked:to-pink-500 shadow-inner" data-astro-cid-jvr44bst></div> <div class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-lg transform transition-transform duration-300 peer-checked:translate-x-5" data-astro-cid-jvr44bst></div> </label> </div> </div> </div> </div> </div> </div> </nav>  <script>(function(){', "\n  // NavBar script initialization (debug removed for production)\n  // Mobile menu functionality starts here\n  \n  // Search input apple gradient animation\n  function initSearchAnimation() {\n    if (!animationConfig.searchGradientEnabled) {\n      return;\n    }\n\n    const searchInput = document.getElementById('search-input');\n    const searchInputMobile = document.getElementById('search-input-mobile');\n    \n    [searchInput, searchInputMobile].forEach(input => {\n      if (!input) return;\n\n      // Add gradient on focus\n      const addGradient = () => {\n        input.classList.add('apple-gradient-active');\n      };\n\n      // Remove gradient\n      const removeGradient = () => {\n        input.classList.remove('apple-gradient-active');\n      };\n\n      // Event listeners\n      input.addEventListener('focus', addGradient);\n      input.addEventListener('blur', removeGradient);\n    });\n    \n    // Remove gradient on scroll (user is moving away)\n    let scrollTimeout;\n    const handleScroll = () => {\n      [searchInput, searchInputMobile].forEach(input => {\n        if (input && input.classList.contains('apple-gradient-active')) {\n          clearTimeout(scrollTimeout);\n          scrollTimeout = setTimeout(() => input.classList.remove('apple-gradient-active'), animationConfig.searchScrollDelay);\n        }\n      });\n    };\n    \n    window.addEventListener('scroll', handleScroll, { passive: true });\n\n    // Apply animation settings\n    const body = document.body;\n    if (!animationConfig.searchGradientEnabled) {\n      body.classList.add('search-gradient-disabled');\n    } else {\n      body.classList.remove('search-gradient-disabled');\n    }\n  }\n\n  // Mobile menu functionality\n  function initMobileMenu() {\n    // Mobile menu initialization (debug removed for production)\n    const menuToggle = document.getElementById('mobile-menu-toggle');\n    const mobileMenu = document.getElementById('mobile-menu');\n    const mobileMenuClose = document.getElementById('mobile-menu-close');\n    const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');\n    \n    // Menu elements validation\n    \n    if (!menuToggle || !mobileMenu) {\n      // Mobile menu elements not found - fail silently in production\n      return;\n    }\n\n    let isMenuOpen = false;\n\n    // Mobile settings tracking\n    let userHasClosedSettings = false;\n    let isFirstMenuOpen = true;\n\n    const openMenu = () => {\n\n      isMenuOpen = true;\n      mobileMenu.classList.add('menu-open');\n      menuToggle.setAttribute('aria-expanded', 'true');\n      menuToggle.querySelector('.hamburger-icon').classList.add('hidden');\n      menuToggle.querySelector('.close-icon').classList.remove('hidden');\n      document.body.style.overflow = 'hidden'; // Prevent body scroll\n      \n      // Mobile settings auto-open logic\n      const mobileSettingsPanel = document.getElementById('mobileSettingsPanel');\n      const settingsChevron = document.getElementById('settingsChevron');\n      \n      if (mobileSettingsPanel && settingsChevron) {\n        if (isFirstMenuOpen && !userHasClosedSettings) {\n          // First time opening - auto open settings\n          mobileSettingsPanel.classList.remove('hidden');\n          settingsChevron.style.transform = 'rotate(180deg)';\n          isFirstMenuOpen = false;\n        }\n        // Subsequent opens - keep current state unless user manually closed it\n      }\n      \n      // Hide the floating dock when mobile menu is open\n      const floatingDock = document.getElementById('floatingDock');\n      if (floatingDock) {\n        floatingDock.classList.add('translate-y-full', 'opacity-0');\n        floatingDock.classList.remove('translate-y-0', 'opacity-100');\n      }\n    };\n\n    const closeMenu = () => {\n\n      isMenuOpen = false;\n      mobileMenu.classList.remove('menu-open');\n      menuToggle.setAttribute('aria-expanded', 'false');\n      menuToggle.querySelector('.hamburger-icon').classList.remove('hidden');\n      menuToggle.querySelector('.close-icon').classList.add('hidden');\n      document.body.style.overflow = ''; // Restore body scroll\n      \n      // Always close settings panel when mobile menu closes\n      const mobileSettingsPanel = document.getElementById('mobileSettingsPanel');\n      const settingsChevron = document.getElementById('settingsChevron');\n      \n      if (mobileSettingsPanel && settingsChevron) {\n        mobileSettingsPanel.classList.add('hidden');\n        settingsChevron.style.transform = 'rotate(0deg)';\n      }\n      \n      // Show the floating dock when mobile menu is closed (only if not at top of page)\n      const floatingDock = document.getElementById('floatingDock');\n      const topNav = document.getElementById('topNav');\n      if (floatingDock && topNav) {\n        // Check if top nav is visible to determine if dock should be shown\n        const topNavRect = topNav.getBoundingClientRect();\n        const isTopNavVisible = topNavRect.top >= -10; // Small threshold for intersection\n        \n        if (!isTopNavVisible) {\n          // Only show dock if user has scrolled down\n          floatingDock.classList.remove('translate-y-full', 'opacity-0');\n          floatingDock.classList.add('translate-y-0', 'opacity-100');\n        }\n      }\n    };\n\n    // Make settings state tracking available to settings toggle\n    window.mobileSettingsState = {\n      setUserClosed: (closed) => { userHasClosedSettings = closed; }\n    };\n\n    // Toggle menu on button click\n    menuToggle.addEventListener('click', (e) => {\n\n      if (isMenuOpen) {\n        closeMenu();\n      } else {\n        openMenu();\n      }\n    });\n\n    // Close menu on close button click\n    if (mobileMenuClose) {\n      mobileMenuClose.addEventListener('click', closeMenu);\n    }\n\n    // Close menu when clicking on navigation links\n    mobileNavLinks.forEach(link => {\n      link.addEventListener('click', closeMenu);\n    });\n\n    // Add swipe gesture support to close mobile menu\n    let touchStartX = 0;\n    let touchStartY = 0;\n    let touchEndX = 0;\n    let touchEndY = 0;\n    const minSwipeDistance = 100;\n    const maxVerticalDistance = 100;\n\n    const handleTouchStart = (e) => {\n      if (!isMenuOpen) return;\n      touchStartX = e.touches[0].clientX;\n      touchStartY = e.touches[0].clientY;\n    };\n\n    const handleTouchMove = (e) => {\n      if (!isMenuOpen) return;\n      \n      const currentX = e.touches[0].clientX;\n      const swipeDistance = currentX - touchStartX;\n      \n      // Add visual feedback during swipe\n      const mobileMenuContent = mobileMenu.querySelector('div:last-child');\n      if (mobileMenuContent && swipeDistance > 0) {\n        // Apply subtle transform during right swipe\n        const transform = Math.min(swipeDistance * 0.2, 20); // Limit to 20px\n        mobileMenuContent.style.transform = `translateX(${transform}px)`;\n      }\n      \n      // Prevent default to avoid scrolling during swipe\n      e.preventDefault();\n    };\n\n    const handleTouchEnd = (e) => {\n      if (!isMenuOpen) return;\n      touchEndX = e.changedTouches[0].clientX;\n      touchEndY = e.changedTouches[0].clientY;\n\n      const swipeDistanceX = touchEndX - touchStartX;\n      const swipeDistanceY = Math.abs(touchEndY - touchStartY);\n\n      // Reset transform\n      const mobileMenuContent = mobileMenu.querySelector('div:last-child');\n      if (mobileMenuContent) {\n        mobileMenuContent.style.transform = '';\n      }\n\n      // Detect right swipe (positive X distance) with minimal vertical movement\n      if (swipeDistanceX > minSwipeDistance && swipeDistanceY < maxVerticalDistance) {\n        closeMenu();\n      }\n    };\n\n    // Close menu when clicking outside (on backdrop)\n    const mobileMenuBackdrop = document.getElementById('mobile-menu-backdrop');\n    if (mobileMenuBackdrop) {\n      mobileMenuBackdrop.addEventListener('click', (e) => {\n        closeMenu();\n      });\n\n      // Also add swipe gesture to backdrop for better UX\n      mobileMenuBackdrop.addEventListener('touchstart', handleTouchStart, { passive: true });\n      mobileMenuBackdrop.addEventListener('touchmove', handleTouchMove, { passive: false });\n      mobileMenuBackdrop.addEventListener('touchend', handleTouchEnd, { passive: true });\n    }\n\n    // Also handle clicks on the menu overlay itself\n    mobileMenu.addEventListener('click', (e) => {\n      // Only close if clicking directly on the menu overlay (not on menu content)\n      if (e.target === mobileMenu) {\n\n        closeMenu();\n      }\n    });\n\n    // Close menu on escape key\n    document.addEventListener('keydown', (e) => {\n      if (e.key === 'Escape' && isMenuOpen) {\n        closeMenu();\n      }\n    });\n\n    // Close menu on window resize to desktop\n    window.addEventListener('resize', () => {\n      if (window.innerWidth >= 1111 && isMenuOpen) {\n        closeMenu();\n      }\n    });\n\n    // Add touch event listeners to the mobile menu content\n    const mobileMenuContent = mobileMenu.querySelector('div:last-child'); // The menu content div\n    if (mobileMenuContent) {\n      mobileMenuContent.addEventListener('touchstart', handleTouchStart, { passive: true });\n      mobileMenuContent.addEventListener('touchmove', handleTouchMove, { passive: false });\n      mobileMenuContent.addEventListener('touchend', handleTouchEnd, { passive: true });\n    }\n\n    // Connect mobile settings toggles to main settings functionality\n    const mobileThemeToggle = document.getElementById('mobileThemeToggle');\n    const mobileMarqueeToggle = document.getElementById('mobileMarqueeToggle');\n    const mobileColorfulTitlesToggle = document.getElementById('mobileColorfulTitlesToggle');\n    \n    // Connect to main settings toggles (if they exist)\n    const mainThemeToggle = document.getElementById('themeToggle');\n    const mainMarqueeToggle = document.getElementById('marqueeToggle');\n    const mainColorfulTitlesToggle = document.getElementById('colorfulTitlesToggle');\n\n    // Sync mobile theme toggle\n    if (mobileThemeToggle && mainThemeToggle) {\n      // Sync initial state\n      mobileThemeToggle.checked = mainThemeToggle.checked;\n      \n      mobileThemeToggle.addEventListener('change', () => {\n        mainThemeToggle.checked = mobileThemeToggle.checked;\n        mainThemeToggle.dispatchEvent(new Event('change'));\n\n      });\n    }\n\n    // Sync mobile marquee toggle\n    if (mobileMarqueeToggle && mainMarqueeToggle) {\n      // Sync initial state\n      mobileMarqueeToggle.checked = mainMarqueeToggle.checked;\n      \n      mobileMarqueeToggle.addEventListener('change', () => {\n        mainMarqueeToggle.checked = mobileMarqueeToggle.checked;\n        mainMarqueeToggle.dispatchEvent(new Event('change'));\n\n      });\n    }\n\n    // Sync mobile colorful titles toggle\n    if (mobileColorfulTitlesToggle && mainColorfulTitlesToggle) {\n      // Sync initial state\n      mobileColorfulTitlesToggle.checked = mainColorfulTitlesToggle.checked;\n      \n      mobileColorfulTitlesToggle.addEventListener('change', () => {\n        mainColorfulTitlesToggle.checked = mobileColorfulTitlesToggle.checked;\n        mainColorfulTitlesToggle.dispatchEvent(new Event('change'));\n\n      });\n    }\n\n  }\n\n  // Developer utility - accessible from browser console\n  if (!window.MannyKnowsNavigation) {\n    window.MannyKnowsNavigation = {\n      searchAnimation: {\n        config: animationConfig,\n        toggle: () => {\n          animationConfig.searchGradientEnabled = !animationConfig.searchGradientEnabled;\n\n        },\n        status: () => {\n          console.table(animationConfig);\n        }\n      },\n      mobileMenu: {\n        open: () => document.getElementById('mobile-menu-toggle')?.click(),\n        close: () => {\n          const menu = document.getElementById('mobile-menu');\n          if (menu && menu.classList.contains('menu-open')) {\n            document.getElementById('mobile-menu-toggle')?.click();\n          }\n        }\n      }\n    };\n  }\n\n  // Mobile Settings Panel Initialization\n  function initMobileSettings() {\n\n    // Immediate check\n\n    const mobileSettingsToggle = document.getElementById('mobileSettingsToggle');\n    const mobileSettingsPanel = document.getElementById('mobileSettingsPanel');\n    const settingsChevron = document.getElementById('settingsChevron');\n\n    if (mobileSettingsToggle && mobileSettingsPanel && settingsChevron) {\n\n      // Settings toggle event listener\n      mobileSettingsToggle.addEventListener('click', (e) => {\n        e.preventDefault();\n        e.stopPropagation();\n        \n        const isHidden = mobileSettingsPanel.classList.contains('hidden');\n        \n        if (isHidden) {\n          // Show settings panel\n          mobileSettingsPanel.classList.remove('hidden');\n          settingsChevron.style.transform = 'rotate(180deg)';\n          // User opened it manually\n          if (window.mobileSettingsState) {\n            window.mobileSettingsState.setUserClosed(false);\n          }\n        } else {\n          // Hide settings panel\n          mobileSettingsPanel.classList.add('hidden');\n          settingsChevron.style.transform = 'rotate(0deg)';\n          // User closed it manually\n          if (window.mobileSettingsState) {\n            window.mobileSettingsState.setUserClosed(true);\n          }\n        }\n      });\n\n    } else {\n      // Try with timeout\n      setTimeout(() => {\n        const mobileSettingsToggle2 = document.getElementById('mobileSettingsToggle');\n        const mobileSettingsPanel2 = document.getElementById('mobileSettingsPanel');\n        const settingsChevron2 = document.getElementById('settingsChevron');\n\n        if (mobileSettingsToggle2 && mobileSettingsPanel2 && settingsChevron2) {\n          \n          mobileSettingsToggle2.addEventListener('click', (e) => {\n            e.preventDefault();\n            e.stopPropagation();\n            \n            const isHidden = mobileSettingsPanel2.classList.contains('hidden');\n            \n            if (isHidden) {\n              mobileSettingsPanel2.classList.remove('hidden');\n              settingsChevron2.style.transform = 'rotate(180deg)';\n              if (window.mobileSettingsState) {\n                window.mobileSettingsState.setUserClosed(false);\n              }\n            } else {\n              mobileSettingsPanel2.classList.add('hidden');\n              settingsChevron2.style.transform = 'rotate(0deg)';\n              if (window.mobileSettingsState) {\n                window.mobileSettingsState.setUserClosed(true);\n              }\n            }\n          });\n        }\n      }, 500);\n    }\n  }\n\n  // Initialize when DOM is ready\n  document.addEventListener('DOMContentLoaded', () => {\n    initSearchAnimation();\n    initMobileMenu();\n    initMobileSettings(); // Add separate initialization\n  }, { passive: true });\n})();<\/script>"], ["", '<nav id="topNav"', ` data-astro-cid-jvr44bst> <div class="max-w-[1440px] mx-auto px-2 w-full" data-astro-cid-jvr44bst> <!-- Desktop Layout --> <div class="hidden xl:flex justify-between items-center w-full" data-astro-cid-jvr44bst> <!-- Logo --> <h1 class="text-5xl font-black m-0" data-astro-cid-jvr44bst> <a href="/" class="logo-gradient text-text-light-primary dark:text-text-dark-primary font-black transition-all duration-500 no-underline relative overflow-hidden before:content-[''] before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/6 before:to-transparent before:-translate-x-full before:animate-subtle-shimmer before:pointer-events-none" data-astro-cid-jvr44bst>
MK
</a> </h1> <!-- Navigation Menu --> <ul class="flex list-none gap-8 m-0 p-0 flex-1 justify-center ml-8" data-astro-cid-jvr44bst> `, ' </ul> <!-- Search Bar --> <div class="relative flex items-center flex-1 mx-4" data-astro-cid-jvr44bst> <label for="search-input" class="absolute -left-[10000px] opacity-0 pointer-events-none" data-astro-cid-jvr44bst>Browse Services Catalog</label> <input id="search-input" type="search" placeholder="Browse services catalog..." class="bg-black/10 dark:bg-white/10 border border-border-light dark:border-border-dark rounded-lg py-3 pl-4 pr-10 text-text-light-primary dark:text-text-dark-primary text-sm w-full h-12 transition-all duration-300 backdrop-blur-lg placeholder:text-text-light-tertiary dark:placeholder:text-text-dark-tertiary focus:outline-none focus:border-primary-blue/50 focus:bg-black/20 dark:focus:bg-white/20 focus:shadow-[0_0_0_2px_rgba(16,209,255,0.2)]" data-astro-cid-jvr44bst> <button type="button" class="absolute right-2 bg-none border-none text-text-light-tertiary dark:text-text-dark-tertiary cursor-pointer p-1 rounded transition-colors duration-300 flex items-center justify-center hover:text-text-light-primary dark:hover:text-text-dark-primary" aria-label="AI Search" data-astro-cid-jvr44bst> <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" data-astro-cid-jvr44bst> <path d="M12 0l1.5 4.5L18 6l-4.5 1.5L12 12l-1.5-4.5L6 6l4.5-1.5L12 0z" data-astro-cid-jvr44bst></path> <path d="M20 8l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" data-astro-cid-jvr44bst></path> <path d="M4 16l0.8 2.4L7.2 19.2l-2.4 0.8L4 22.4l-0.8-2.4L0.8 19.2l2.4-0.8L4 16z" data-astro-cid-jvr44bst></path> </svg> </button> </div> <!-- Navigation Actions --> <div class="flex items-center gap-2 relative" data-astro-cid-jvr44bst> ', " ", ` <button type="button" class="group bg-gradient-to-br from-green-500 via-emerald-500 to-green-600 bg-200 border border-green-400/30 rounded-lg text-white w-12 h-12 flex items-center justify-center cursor-pointer transition-all duration-300 relative overflow-hidden hover:scale-105 hover:shadow-[0_8px_25px_rgba(34,197,94,0.4)] animate-green-gradient-flow before:content-[''] before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/8 before:to-transparent before:-translate-x-full before:animate-green-shimmer" id="topChatToggle" data-astro-cid-jvr44bst> <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="relative z-10" data-astro-cid-jvr44bst> <path d="M12 8V4H8" data-astro-cid-jvr44bst></path> <rect width="16" height="12" x="4" y="8" rx="2" data-astro-cid-jvr44bst></rect> <path d="M2 14h2" data-astro-cid-jvr44bst></path> <path d="M20 14h2" data-astro-cid-jvr44bst></path> <path d="M15 13v2" data-astro-cid-jvr44bst></path> <path d="M9 13v2" data-astro-cid-jvr44bst></path> </svg> <!-- Tooltip --> <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black dark:bg-white text-white dark:text-black text-sm whitespace-nowrap rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-lg pointer-events-none" role="tooltip" data-astro-cid-jvr44bst>
Talk to Us
</div> </button> </div> </div> <!-- Mobile Layout --> <div class="flex xl:hidden items-center w-full h-16 px-0" data-astro-cid-jvr44bst> <!-- Logo - 15% --> <div class="flex-[0_0_15%] flex items-center" data-astro-cid-jvr44bst> <h1 class="text-3xl font-black m-0 leading-none" data-astro-cid-jvr44bst> <a href="/" class="logo-gradient text-text-light-primary dark:text-text-dark-primary font-black transition-all duration-500 no-underline relative overflow-hidden before:content-[''] before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/6 before:to-transparent before:-translate-x-full before:animate-subtle-shimmer before:pointer-events-none" data-astro-cid-jvr44bst>
MK
</a> </h1> </div> <!-- Search Bar - 70% --> <div class="flex-[0_0_70%] flex items-center px-2" data-astro-cid-jvr44bst> <div class="relative flex items-center w-full" data-astro-cid-jvr44bst> <label for="search-input-mobile" class="absolute -left-[10000px] opacity-0 pointer-events-none" data-astro-cid-jvr44bst>Browse Services Catalog</label> <input id="search-input-mobile" type="search" placeholder="Browse services catalog..." class="bg-black/10 dark:bg-white/10 border border-border-light dark:border-border-dark rounded-lg py-2 pl-3 pr-8 text-text-light-primary dark:text-text-dark-primary text-sm w-full h-10 transition-all duration-300 backdrop-blur-lg placeholder:text-text-light-tertiary dark:placeholder:text-text-dark-tertiary focus:outline-none focus:border-primary-blue/50 focus:bg-black/20 dark:focus:bg-white/20 focus:shadow-[0_0_0_2px_rgba(16,209,255,0.2)]" data-astro-cid-jvr44bst> <button type="button" class="absolute right-2 bg-none border-none text-text-light-tertiary dark:text-text-dark-tertiary cursor-pointer p-1 rounded transition-colors duration-300 flex items-center justify-center h-6 w-6 hover:text-text-light-primary dark:hover:text-text-dark-primary" aria-label="AI Search" data-astro-cid-jvr44bst> <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" data-astro-cid-jvr44bst> <path d="M12 0l1.5 4.5L18 6l-4.5 1.5L12 12l-1.5-4.5L6 6l4.5-1.5L12 0z" data-astro-cid-jvr44bst></path> <path d="M20 8l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" data-astro-cid-jvr44bst></path> <path d="M4 16l0.8 2.4L7.2 19.2l-2.4 0.8L4 22.4l-0.8-2.4L0.8 19.2l2.4-0.8L4 16z" data-astro-cid-jvr44bst></path> </svg> </button> </div> </div> <!-- Hamburger Menu - 15% --> <div class="flex-[0_0_15%] flex justify-center items-center" data-astro-cid-jvr44bst> <button type="button" id="mobile-menu-toggle" class="p-2 rounded-lg text-text-light-primary dark:text-text-dark-primary hover:bg-black/10 dark:hover:bg-white/10 transition-colors duration-300 flex items-center justify-center" aria-label="Toggle mobile menu" aria-expanded="false" data-astro-cid-jvr44bst> <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="hamburger-icon" data-astro-cid-jvr44bst> <line x1="3" y1="6" x2="21" y2="6" data-astro-cid-jvr44bst></line> <line x1="3" y1="12" x2="21" y2="12" data-astro-cid-jvr44bst></line> <line x1="3" y1="18" x2="21" y2="18" data-astro-cid-jvr44bst></line> </svg> <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="close-icon hidden" data-astro-cid-jvr44bst> <line x1="18" y1="6" x2="6" y2="18" data-astro-cid-jvr44bst></line> <line x1="6" y1="6" x2="18" y2="18" data-astro-cid-jvr44bst></line> </svg> </button> </div> </div> </div> <!-- Mobile Menu Overlay --> <div id="mobile-menu" class="fixed inset-0 z-50 xl:hidden transform translate-x-full transition-transform duration-300 ease-in-out" data-astro-cid-jvr44bst> <!-- Light Glassmorphism Background --> <div id="mobile-menu-backdrop" class="absolute inset-0 bg-white/20 dark:bg-gray-900/25 backdrop-blur-xl" data-astro-cid-jvr44bst></div> <!-- Menu Content --> <div class="relative h-full w-[95%] ml-auto flex flex-col bg-white/90 dark:bg-gray-900/85 backdrop-blur-xl border-l border-gray-300/30 dark:border-white/20 shadow-xl" data-astro-cid-jvr44bst> <!-- Header with Close Button --> <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700" data-astro-cid-jvr44bst> <h2 class="text-xl font-semibold text-text-light-primary dark:text-text-dark-primary" data-astro-cid-jvr44bst>Menu</h2> <button type="button" id="mobile-menu-close" class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200" aria-label="Close mobile menu" data-astro-cid-jvr44bst> <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-text-light-primary dark:text-text-dark-primary" data-astro-cid-jvr44bst> <line x1="18" y1="6" x2="6" y2="18" data-astro-cid-jvr44bst></line> <line x1="6" y1="6" x2="18" y2="18" data-astro-cid-jvr44bst></line> </svg> </button> </div> <!-- Navigation Links --> <div class="px-4 py-4 space-y-2" data-astro-cid-jvr44bst> `, ' </div> <!-- Action Buttons --> <div class="p-6 border-t border-gray-200 dark:border-gray-700 space-y-3" data-astro-cid-jvr44bst> <div class="flex gap-3" data-astro-cid-jvr44bst> ', " ", ' </div> <!-- Settings Section --> <div class="mt-6" data-astro-cid-jvr44bst> <!-- Settings Toggle Button --> <button type="button" id="mobileSettingsToggle" class="group w-full p-3 bg-gray-100/50 dark:bg-gray-800/50 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 transition-all duration-200 flex items-center justify-between" data-astro-cid-jvr44bst> <div class="flex items-center gap-3" data-astro-cid-jvr44bst> <!-- User Preferences Icon --> <svg class="w-5 h-5 text-gray-600 dark:text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-astro-cid-jvr44bst> <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" data-astro-cid-jvr44bst></path> <circle cx="12" cy="7" r="4" data-astro-cid-jvr44bst></circle> </svg> <span class="text-gray-700 dark:text-gray-300 font-medium" data-astro-cid-jvr44bst>User preferences</span> </div> <svg class="w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200" id="settingsChevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-astro-cid-jvr44bst> <polyline points="6,9 12,15 18,9" data-astro-cid-jvr44bst></polyline> </svg> </button> <!-- Inline Settings Panel --> <div id="mobileSettingsPanel" class="hidden mt-2 p-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg border border-gray-200/50 dark:border-gray-600/50 space-y-3" data-astro-cid-jvr44bst> <!-- Theme Setting --> <div class="flex items-center justify-between" data-astro-cid-jvr44bst> <div class="flex items-center gap-2" data-astro-cid-jvr44bst> <div class="w-6 h-6 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-md flex items-center justify-center" data-astro-cid-jvr44bst> <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-blue-600 dark:text-blue-400" data-astro-cid-jvr44bst> <circle cx="12" cy="12" r="5" data-astro-cid-jvr44bst></circle> <line x1="12" y1="1" x2="12" y2="3" data-astro-cid-jvr44bst></line> <line x1="12" y1="21" x2="12" y2="23" data-astro-cid-jvr44bst></line> <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" data-astro-cid-jvr44bst></line> <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" data-astro-cid-jvr44bst></line> <line x1="1" y1="12" x2="3" y2="12" data-astro-cid-jvr44bst></line> <line x1="21" y1="12" x2="23" y2="12" data-astro-cid-jvr44bst></line> <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" data-astro-cid-jvr44bst></line> <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" data-astro-cid-jvr44bst></line> </svg> </div> <div data-astro-cid-jvr44bst> <div class="text-sm font-medium text-gray-800 dark:text-white" data-astro-cid-jvr44bst>Theme</div> <div class="text-xs text-gray-600 dark:text-gray-400" data-astro-cid-jvr44bst>Light/Dark mode</div> </div> </div> <label class="relative inline-flex items-center cursor-pointer" data-astro-cid-jvr44bst> <input type="checkbox" id="mobileThemeToggle" class="sr-only peer" checked data-astro-cid-jvr44bst> <!-- Modern iOS-style toggle switch with sliding handle --> <div class="relative w-10 h-5 bg-gray-200 dark:bg-gray-700 rounded-full peer-focus:ring-2 peer-focus:ring-blue-300/30 dark:peer-focus:ring-blue-800/30 transition-all duration-300 peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-indigo-600 shadow-inner" data-astro-cid-jvr44bst></div> <!-- Sliding toggle handle - direct sibling for peer-checked to work --> <div class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-lg transform transition-transform duration-300 peer-checked:translate-x-5 flex items-center justify-center" data-astro-cid-jvr44bst> <!-- Light mode icon (sun) - visible when NOT checked (light mode) --> <svg class="absolute w-3 h-3 text-yellow-500 transition-opacity duration-200 opacity-100 peer-checked:opacity-0" viewBox="0 0 20 20" fill="currentColor" data-astro-cid-jvr44bst> <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd" data-astro-cid-jvr44bst></path> </svg> <!-- Dark mode icon (moon) - visible when checked (dark mode) --> <svg class="absolute w-3 h-3 text-slate-700 transition-opacity duration-200 opacity-0 peer-checked:opacity-100" viewBox="0 0 20 20" fill="currentColor" data-astro-cid-jvr44bst> <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" data-astro-cid-jvr44bst></path> </svg> </div> </label></div> <!-- Marquee Setting --> <div class="flex items-center justify-between" data-astro-cid-jvr44bst> <div class="flex items-center gap-2" data-astro-cid-jvr44bst> <div class="w-6 h-6 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-md flex items-center justify-center" data-astro-cid-jvr44bst> <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-green-600 dark:text-green-400" data-astro-cid-jvr44bst> <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z" data-astro-cid-jvr44bst></path> <path d="M8 21l4-7 4 7M13 10V7" data-astro-cid-jvr44bst></path> </svg> </div> <div data-astro-cid-jvr44bst> <div class="text-sm font-medium text-gray-800 dark:text-white" data-astro-cid-jvr44bst>Marquee</div> <div class="text-xs text-gray-600 dark:text-gray-400" data-astro-cid-jvr44bst>Animated text banner</div> </div> </div> <label class="relative inline-flex items-center cursor-pointer" data-astro-cid-jvr44bst> <input type="checkbox" id="mobileMarqueeToggle" class="sr-only peer" checked data-astro-cid-jvr44bst> <div class="relative w-10 h-5 bg-gray-200 dark:bg-gray-700 rounded-full peer-focus:ring-2 peer-focus:ring-green-300/30 dark:peer-focus:ring-green-800/30 transition-all duration-300 peer-checked:bg-gradient-to-r peer-checked:from-green-500 peer-checked:to-emerald-600 shadow-inner" data-astro-cid-jvr44bst></div> <div class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-lg transform transition-transform duration-300 peer-checked:translate-x-5 flex items-center justify-center" data-astro-cid-jvr44bst> <!-- Hide icon (eye-slash) - visible when NOT checked --> <svg class="absolute w-3 h-3 text-gray-500 transition-opacity duration-200 opacity-100 peer-checked:opacity-0" viewBox="0 0 20 20" fill="currentColor" data-astro-cid-jvr44bst> <path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clip-rule="evenodd" data-astro-cid-jvr44bst></path> <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" data-astro-cid-jvr44bst></path> </svg> <!-- Show icon (eye) - visible when checked --> <svg class="absolute w-3 h-3 text-green-600 transition-opacity duration-200 opacity-0 peer-checked:opacity-100" viewBox="0 0 20 20" fill="currentColor" data-astro-cid-jvr44bst> <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" data-astro-cid-jvr44bst></path> <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" data-astro-cid-jvr44bst></path> </svg> </div> </label> </div> <!-- Colorful Titles Setting --> <div class="flex items-center justify-between" data-astro-cid-jvr44bst> <div class="flex items-center gap-2" data-astro-cid-jvr44bst> <div class="w-6 h-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-md flex items-center justify-center" data-astro-cid-jvr44bst> <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-purple-600 dark:text-purple-400" data-astro-cid-jvr44bst> <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" data-astro-cid-jvr44bst></path> </svg> </div> <div data-astro-cid-jvr44bst> <div class="text-sm font-medium text-gray-800 dark:text-white" data-astro-cid-jvr44bst>Colorful Titles</div> <div class="text-xs text-gray-600 dark:text-gray-400" data-astro-cid-jvr44bst>Gradient text effects</div> </div> </div> <label class="relative inline-flex items-center cursor-pointer" data-astro-cid-jvr44bst> <input type="checkbox" id="mobileColorfulTitlesToggle" class="sr-only peer" checked data-astro-cid-jvr44bst> <div class="relative w-10 h-5 bg-gray-200 dark:bg-gray-700 rounded-full peer-focus:ring-2 peer-focus:ring-purple-300/30 dark:peer-focus:ring-purple-800/30 transition-all duration-300 peer-checked:bg-gradient-to-r peer-checked:from-purple-500 peer-checked:to-pink-500 shadow-inner" data-astro-cid-jvr44bst></div> <div class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-lg transform transition-transform duration-300 peer-checked:translate-x-5" data-astro-cid-jvr44bst></div> </label> </div> </div> </div> </div> </div> </div> </nav>  <script>(function(){', "\n  // NavBar script initialization (debug removed for production)\n  // Mobile menu functionality starts here\n  \n  // Search input apple gradient animation\n  function initSearchAnimation() {\n    if (!animationConfig.searchGradientEnabled) {\n      return;\n    }\n\n    const searchInput = document.getElementById('search-input');\n    const searchInputMobile = document.getElementById('search-input-mobile');\n    \n    [searchInput, searchInputMobile].forEach(input => {\n      if (!input) return;\n\n      // Add gradient on focus\n      const addGradient = () => {\n        input.classList.add('apple-gradient-active');\n      };\n\n      // Remove gradient\n      const removeGradient = () => {\n        input.classList.remove('apple-gradient-active');\n      };\n\n      // Event listeners\n      input.addEventListener('focus', addGradient);\n      input.addEventListener('blur', removeGradient);\n    });\n    \n    // Remove gradient on scroll (user is moving away)\n    let scrollTimeout;\n    const handleScroll = () => {\n      [searchInput, searchInputMobile].forEach(input => {\n        if (input && input.classList.contains('apple-gradient-active')) {\n          clearTimeout(scrollTimeout);\n          scrollTimeout = setTimeout(() => input.classList.remove('apple-gradient-active'), animationConfig.searchScrollDelay);\n        }\n      });\n    };\n    \n    window.addEventListener('scroll', handleScroll, { passive: true });\n\n    // Apply animation settings\n    const body = document.body;\n    if (!animationConfig.searchGradientEnabled) {\n      body.classList.add('search-gradient-disabled');\n    } else {\n      body.classList.remove('search-gradient-disabled');\n    }\n  }\n\n  // Mobile menu functionality\n  function initMobileMenu() {\n    // Mobile menu initialization (debug removed for production)\n    const menuToggle = document.getElementById('mobile-menu-toggle');\n    const mobileMenu = document.getElementById('mobile-menu');\n    const mobileMenuClose = document.getElementById('mobile-menu-close');\n    const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');\n    \n    // Menu elements validation\n    \n    if (!menuToggle || !mobileMenu) {\n      // Mobile menu elements not found - fail silently in production\n      return;\n    }\n\n    let isMenuOpen = false;\n\n    // Mobile settings tracking\n    let userHasClosedSettings = false;\n    let isFirstMenuOpen = true;\n\n    const openMenu = () => {\n\n      isMenuOpen = true;\n      mobileMenu.classList.add('menu-open');\n      menuToggle.setAttribute('aria-expanded', 'true');\n      menuToggle.querySelector('.hamburger-icon').classList.add('hidden');\n      menuToggle.querySelector('.close-icon').classList.remove('hidden');\n      document.body.style.overflow = 'hidden'; // Prevent body scroll\n      \n      // Mobile settings auto-open logic\n      const mobileSettingsPanel = document.getElementById('mobileSettingsPanel');\n      const settingsChevron = document.getElementById('settingsChevron');\n      \n      if (mobileSettingsPanel && settingsChevron) {\n        if (isFirstMenuOpen && !userHasClosedSettings) {\n          // First time opening - auto open settings\n          mobileSettingsPanel.classList.remove('hidden');\n          settingsChevron.style.transform = 'rotate(180deg)';\n          isFirstMenuOpen = false;\n        }\n        // Subsequent opens - keep current state unless user manually closed it\n      }\n      \n      // Hide the floating dock when mobile menu is open\n      const floatingDock = document.getElementById('floatingDock');\n      if (floatingDock) {\n        floatingDock.classList.add('translate-y-full', 'opacity-0');\n        floatingDock.classList.remove('translate-y-0', 'opacity-100');\n      }\n    };\n\n    const closeMenu = () => {\n\n      isMenuOpen = false;\n      mobileMenu.classList.remove('menu-open');\n      menuToggle.setAttribute('aria-expanded', 'false');\n      menuToggle.querySelector('.hamburger-icon').classList.remove('hidden');\n      menuToggle.querySelector('.close-icon').classList.add('hidden');\n      document.body.style.overflow = ''; // Restore body scroll\n      \n      // Always close settings panel when mobile menu closes\n      const mobileSettingsPanel = document.getElementById('mobileSettingsPanel');\n      const settingsChevron = document.getElementById('settingsChevron');\n      \n      if (mobileSettingsPanel && settingsChevron) {\n        mobileSettingsPanel.classList.add('hidden');\n        settingsChevron.style.transform = 'rotate(0deg)';\n      }\n      \n      // Show the floating dock when mobile menu is closed (only if not at top of page)\n      const floatingDock = document.getElementById('floatingDock');\n      const topNav = document.getElementById('topNav');\n      if (floatingDock && topNav) {\n        // Check if top nav is visible to determine if dock should be shown\n        const topNavRect = topNav.getBoundingClientRect();\n        const isTopNavVisible = topNavRect.top >= -10; // Small threshold for intersection\n        \n        if (!isTopNavVisible) {\n          // Only show dock if user has scrolled down\n          floatingDock.classList.remove('translate-y-full', 'opacity-0');\n          floatingDock.classList.add('translate-y-0', 'opacity-100');\n        }\n      }\n    };\n\n    // Make settings state tracking available to settings toggle\n    window.mobileSettingsState = {\n      setUserClosed: (closed) => { userHasClosedSettings = closed; }\n    };\n\n    // Toggle menu on button click\n    menuToggle.addEventListener('click', (e) => {\n\n      if (isMenuOpen) {\n        closeMenu();\n      } else {\n        openMenu();\n      }\n    });\n\n    // Close menu on close button click\n    if (mobileMenuClose) {\n      mobileMenuClose.addEventListener('click', closeMenu);\n    }\n\n    // Close menu when clicking on navigation links\n    mobileNavLinks.forEach(link => {\n      link.addEventListener('click', closeMenu);\n    });\n\n    // Add swipe gesture support to close mobile menu\n    let touchStartX = 0;\n    let touchStartY = 0;\n    let touchEndX = 0;\n    let touchEndY = 0;\n    const minSwipeDistance = 100;\n    const maxVerticalDistance = 100;\n\n    const handleTouchStart = (e) => {\n      if (!isMenuOpen) return;\n      touchStartX = e.touches[0].clientX;\n      touchStartY = e.touches[0].clientY;\n    };\n\n    const handleTouchMove = (e) => {\n      if (!isMenuOpen) return;\n      \n      const currentX = e.touches[0].clientX;\n      const swipeDistance = currentX - touchStartX;\n      \n      // Add visual feedback during swipe\n      const mobileMenuContent = mobileMenu.querySelector('div:last-child');\n      if (mobileMenuContent && swipeDistance > 0) {\n        // Apply subtle transform during right swipe\n        const transform = Math.min(swipeDistance * 0.2, 20); // Limit to 20px\n        mobileMenuContent.style.transform = \\`translateX(\\${transform}px)\\`;\n      }\n      \n      // Prevent default to avoid scrolling during swipe\n      e.preventDefault();\n    };\n\n    const handleTouchEnd = (e) => {\n      if (!isMenuOpen) return;\n      touchEndX = e.changedTouches[0].clientX;\n      touchEndY = e.changedTouches[0].clientY;\n\n      const swipeDistanceX = touchEndX - touchStartX;\n      const swipeDistanceY = Math.abs(touchEndY - touchStartY);\n\n      // Reset transform\n      const mobileMenuContent = mobileMenu.querySelector('div:last-child');\n      if (mobileMenuContent) {\n        mobileMenuContent.style.transform = '';\n      }\n\n      // Detect right swipe (positive X distance) with minimal vertical movement\n      if (swipeDistanceX > minSwipeDistance && swipeDistanceY < maxVerticalDistance) {\n        closeMenu();\n      }\n    };\n\n    // Close menu when clicking outside (on backdrop)\n    const mobileMenuBackdrop = document.getElementById('mobile-menu-backdrop');\n    if (mobileMenuBackdrop) {\n      mobileMenuBackdrop.addEventListener('click', (e) => {\n        closeMenu();\n      });\n\n      // Also add swipe gesture to backdrop for better UX\n      mobileMenuBackdrop.addEventListener('touchstart', handleTouchStart, { passive: true });\n      mobileMenuBackdrop.addEventListener('touchmove', handleTouchMove, { passive: false });\n      mobileMenuBackdrop.addEventListener('touchend', handleTouchEnd, { passive: true });\n    }\n\n    // Also handle clicks on the menu overlay itself\n    mobileMenu.addEventListener('click', (e) => {\n      // Only close if clicking directly on the menu overlay (not on menu content)\n      if (e.target === mobileMenu) {\n\n        closeMenu();\n      }\n    });\n\n    // Close menu on escape key\n    document.addEventListener('keydown', (e) => {\n      if (e.key === 'Escape' && isMenuOpen) {\n        closeMenu();\n      }\n    });\n\n    // Close menu on window resize to desktop\n    window.addEventListener('resize', () => {\n      if (window.innerWidth >= 1111 && isMenuOpen) {\n        closeMenu();\n      }\n    });\n\n    // Add touch event listeners to the mobile menu content\n    const mobileMenuContent = mobileMenu.querySelector('div:last-child'); // The menu content div\n    if (mobileMenuContent) {\n      mobileMenuContent.addEventListener('touchstart', handleTouchStart, { passive: true });\n      mobileMenuContent.addEventListener('touchmove', handleTouchMove, { passive: false });\n      mobileMenuContent.addEventListener('touchend', handleTouchEnd, { passive: true });\n    }\n\n    // Connect mobile settings toggles to main settings functionality\n    const mobileThemeToggle = document.getElementById('mobileThemeToggle');\n    const mobileMarqueeToggle = document.getElementById('mobileMarqueeToggle');\n    const mobileColorfulTitlesToggle = document.getElementById('mobileColorfulTitlesToggle');\n    \n    // Connect to main settings toggles (if they exist)\n    const mainThemeToggle = document.getElementById('themeToggle');\n    const mainMarqueeToggle = document.getElementById('marqueeToggle');\n    const mainColorfulTitlesToggle = document.getElementById('colorfulTitlesToggle');\n\n    // Sync mobile theme toggle\n    if (mobileThemeToggle && mainThemeToggle) {\n      // Sync initial state\n      mobileThemeToggle.checked = mainThemeToggle.checked;\n      \n      mobileThemeToggle.addEventListener('change', () => {\n        mainThemeToggle.checked = mobileThemeToggle.checked;\n        mainThemeToggle.dispatchEvent(new Event('change'));\n\n      });\n    }\n\n    // Sync mobile marquee toggle\n    if (mobileMarqueeToggle && mainMarqueeToggle) {\n      // Sync initial state\n      mobileMarqueeToggle.checked = mainMarqueeToggle.checked;\n      \n      mobileMarqueeToggle.addEventListener('change', () => {\n        mainMarqueeToggle.checked = mobileMarqueeToggle.checked;\n        mainMarqueeToggle.dispatchEvent(new Event('change'));\n\n      });\n    }\n\n    // Sync mobile colorful titles toggle\n    if (mobileColorfulTitlesToggle && mainColorfulTitlesToggle) {\n      // Sync initial state\n      mobileColorfulTitlesToggle.checked = mainColorfulTitlesToggle.checked;\n      \n      mobileColorfulTitlesToggle.addEventListener('change', () => {\n        mainColorfulTitlesToggle.checked = mobileColorfulTitlesToggle.checked;\n        mainColorfulTitlesToggle.dispatchEvent(new Event('change'));\n\n      });\n    }\n\n  }\n\n  // Developer utility - accessible from browser console\n  if (!window.MannyKnowsNavigation) {\n    window.MannyKnowsNavigation = {\n      searchAnimation: {\n        config: animationConfig,\n        toggle: () => {\n          animationConfig.searchGradientEnabled = !animationConfig.searchGradientEnabled;\n\n        },\n        status: () => {\n          console.table(animationConfig);\n        }\n      },\n      mobileMenu: {\n        open: () => document.getElementById('mobile-menu-toggle')?.click(),\n        close: () => {\n          const menu = document.getElementById('mobile-menu');\n          if (menu && menu.classList.contains('menu-open')) {\n            document.getElementById('mobile-menu-toggle')?.click();\n          }\n        }\n      }\n    };\n  }\n\n  // Mobile Settings Panel Initialization\n  function initMobileSettings() {\n\n    // Immediate check\n\n    const mobileSettingsToggle = document.getElementById('mobileSettingsToggle');\n    const mobileSettingsPanel = document.getElementById('mobileSettingsPanel');\n    const settingsChevron = document.getElementById('settingsChevron');\n\n    if (mobileSettingsToggle && mobileSettingsPanel && settingsChevron) {\n\n      // Settings toggle event listener\n      mobileSettingsToggle.addEventListener('click', (e) => {\n        e.preventDefault();\n        e.stopPropagation();\n        \n        const isHidden = mobileSettingsPanel.classList.contains('hidden');\n        \n        if (isHidden) {\n          // Show settings panel\n          mobileSettingsPanel.classList.remove('hidden');\n          settingsChevron.style.transform = 'rotate(180deg)';\n          // User opened it manually\n          if (window.mobileSettingsState) {\n            window.mobileSettingsState.setUserClosed(false);\n          }\n        } else {\n          // Hide settings panel\n          mobileSettingsPanel.classList.add('hidden');\n          settingsChevron.style.transform = 'rotate(0deg)';\n          // User closed it manually\n          if (window.mobileSettingsState) {\n            window.mobileSettingsState.setUserClosed(true);\n          }\n        }\n      });\n\n    } else {\n      // Try with timeout\n      setTimeout(() => {\n        const mobileSettingsToggle2 = document.getElementById('mobileSettingsToggle');\n        const mobileSettingsPanel2 = document.getElementById('mobileSettingsPanel');\n        const settingsChevron2 = document.getElementById('settingsChevron');\n\n        if (mobileSettingsToggle2 && mobileSettingsPanel2 && settingsChevron2) {\n          \n          mobileSettingsToggle2.addEventListener('click', (e) => {\n            e.preventDefault();\n            e.stopPropagation();\n            \n            const isHidden = mobileSettingsPanel2.classList.contains('hidden');\n            \n            if (isHidden) {\n              mobileSettingsPanel2.classList.remove('hidden');\n              settingsChevron2.style.transform = 'rotate(180deg)';\n              if (window.mobileSettingsState) {\n                window.mobileSettingsState.setUserClosed(false);\n              }\n            } else {\n              mobileSettingsPanel2.classList.add('hidden');\n              settingsChevron2.style.transform = 'rotate(0deg)';\n              if (window.mobileSettingsState) {\n                window.mobileSettingsState.setUserClosed(true);\n              }\n            }\n          });\n        }\n      }, 500);\n    }\n  }\n\n  // Initialize when DOM is ready\n  document.addEventListener('DOMContentLoaded', () => {\n    initSearchAnimation();\n    initMobileMenu();\n    initMobileSettings(); // Add separate initialization\n  }, { passive: true });\n})();<\/script>"])), maybeRenderHead(), addAttribute(`bg-transparent min-h-[4.05rem] relative flex items-center border-b border-gray-300/30 dark:border-white/10 ${className}`, "class"), navLinks.map((link2) => renderTemplate`<li data-astro-cid-jvr44bst> <a${addAttribute(link2.href, "href")} class="nav-gradient text-text-light-primary dark:text-text-dark-primary font-medium transition-all duration-500 hover:-translate-y-1 no-underline relative overflow-hidden before:content-[''] before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/6 before:to-transparent before:-translate-x-full before:animate-subtle-shimmer before:pointer-events-none" data-astro-cid-jvr44bst> ${link2.label} </a> </li>`), renderComponent($$result, "Button", $$Button, { "href": "#instant-quote", "text": "FREE 360 PHOTO", "subtext": "CLAIM NOW", "id": "instant-quote-btn", "variant": "theme-aware", "sparkles": true, "sparkleTheme": "purple", "data-astro-cid-jvr44bst": true }), renderComponent($$result, "Button", $$Button, { "href": "#apple-quote", "text": "FREE WEBSITE", "subtext": "AI ANALYSIS", "variant": "emoji", "emoji": "\u{1F680}", "emojiAnimation": "subtle", "sparkles": false, "className": "text-[10px] text-white/80 leading-none", "data-astro-cid-jvr44bst": true }), navLinks.map((link2) => renderTemplate`<a${addAttribute(link2.href, "href")} class="mobile-nav-link block text-base font-medium text-text-light-primary dark:text-text-dark-primary hover:text-primary-blue dark:hover:text-primary-blue transition-colors duration-200" data-astro-cid-jvr44bst> ${link2.label} </a>`), renderComponent($$result, "Button", $$Button, { "href": "#instant-quote", "text": "FREE 360 PHOTO", "subtext": "CLAIM NOW", "variant": "theme-aware", "className": "flex-1 text-center", "data-astro-cid-jvr44bst": true }), renderComponent($$result, "Button", $$Button, { "href": "#apple-quote", "text": "FREE WEBSITE", "subtext": "AI ANALYSIS", "variant": "emoji", "emoji": "\u{1F680}", "emojiAnimation": "subtle", "sparkles": false, "className": "flex-1 text-center text-[10px] text-white/80 leading-none", "data-astro-cid-jvr44bst": true }), defineScriptVars({ animationConfig }));
    }, "/Volumes/MannyKnows/MK/MannyKnows/src/components/navigation/NavBar.astro", void 0);
    $$Astro$1 = createAstro();
    $$Dockbutton = createComponent(($$result, $$props, $$slots) => {
      const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
      Astro2.self = $$Dockbutton;
      const {
        tooltip,
        icon,
        onClick,
        variant = "default",
        id,
        className = ""
      } = Astro2.props;
      const variantClasses = {
        default: "backdrop-blur-lg border rounded-lg transition-all duration-300 hover:scale-110 hover:-translate-y-1",
        brand: "animate-button-gradient text-white backdrop-blur-lg border rounded-lg transition-all duration-300 hover:scale-110 hover:-translate-y-1",
        chat: "backdrop-blur-lg border rounded-lg transition-all duration-300 hover:scale-110 hover:-translate-y-1",
        settings: "backdrop-blur-lg border rounded-lg transition-all duration-300 hover:scale-110 hover:-translate-y-1"
      };
      const variantStyles = {
        default: "background: linear-gradient(135deg, rgba(16, 209, 255, 0.15), rgba(16, 209, 255, 0.08)); border-color: rgba(16, 209, 255, 0.4); box-shadow: 0 4px 20px rgba(16, 209, 255, 0.2), 0 1px 3px rgba(16, 209, 255, 0.1);",
        brand: "background: linear-gradient(-45deg, #3b82f6, #8b5cf6, #ec4899, #10d1ff); background-size: 400% 400%;",
        chat: "background: linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.08)); border-color: rgba(34, 197, 94, 0.4); box-shadow: 0 4px 20px rgba(34, 197, 94, 0.2), 0 1px 3px rgba(34, 197, 94, 0.1);",
        settings: "background: linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(168, 85, 247, 0.08)); border-color: rgba(168, 85, 247, 0.4); box-shadow: 0 4px 20px rgba(168, 85, 247, 0.2), 0 1px 3px rgba(168, 85, 247, 0.1);"
      };
      return renderTemplate`${maybeRenderHead()}<button type="button"${addAttribute(`dock-item group relative flex-1 sm:flex-none ${className}`, "class")}${addAttribute(tooltip, "data-tooltip")}${addAttribute(onClick, "onclick")}${addAttribute(id, "id")} data-astro-cid-ocbrj7rs> <div${addAttribute(`w-full h-full aspect-square sm:w-12 sm:h-12 ${variantClasses[variant]} flex items-center justify-center text-text-light-primary dark:text-text-dark-primary relative overflow-hidden`, "class")}${addAttribute(variantStyles[variant], "style")} data-astro-cid-ocbrj7rs> ${variant === "brand" ? renderTemplate`<span class="text-white font-black text-sm sm:text-lg relative z-10" data-astro-cid-ocbrj7rs>MK</span>` : variant === "chat" ? renderTemplate`<div class="scale-75 sm:scale-100 text-green-400" data-astro-cid-ocbrj7rs> ${renderComponent($$result, "Fragment", Fragment, {}, { "default": /* @__PURE__ */ __name(($$result2) => renderTemplate`${unescapeHTML(icon)}`, "default") })} </div>` : variant === "settings" ? renderTemplate`<div class="scale-75 sm:scale-100 text-purple-400 transition-all duration-300 group-hover:rotate-90" data-astro-cid-ocbrj7rs> ${renderComponent($$result, "Fragment", Fragment, {}, { "default": /* @__PURE__ */ __name(($$result2) => renderTemplate`${unescapeHTML(icon)}`, "default") })} </div>` : renderTemplate`<div class="scale-75 sm:scale-100 text-blue-400" data-astro-cid-ocbrj7rs> ${renderComponent($$result, "Fragment", Fragment, {}, { "default": /* @__PURE__ */ __name(($$result2) => renderTemplate`${unescapeHTML(icon)}`, "default") })} </div>`} </div> <!-- Tooltip --> <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 sm:px-3 sm:py-2 bg-black dark:bg-white text-white dark:text-black text-xs sm:text-sm whitespace-nowrap rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-lg pointer-events-none" role="tooltip" data-astro-cid-ocbrj7rs> ${tooltip} </div> </button> `;
    }, "/Volumes/MannyKnows/MK/MannyKnows/src/components/ui/dockbutton.astro", void 0);
    $$DockMenu = createComponent(($$result, $$props, $$slots) => {
      return renderTemplate`<!-- Floating Dock Menu -->${maybeRenderHead()}<div id="floatingDock" class="fixed bottom-3 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-500 ease-out sm:w-auto w-full max-w-none px-2 sm:px-0" data-astro-cid-r4kjsmet> <div class="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-gray-300/40 dark:border-white/20 rounded-xl sm:rounded-2xl p-1.5 sm:p-2.5 shadow-[0_20px_60px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.4)]" data-astro-cid-r4kjsmet> <div class="flex items-center justify-center gap-2" data-astro-cid-r4kjsmet> <!-- MK Logo --> ${renderComponent($$result, "DockButton", $$Dockbutton, { "tooltip": "Home", "icon": "MK", "onClick": "window.location.href='/'", "variant": "brand", "data-astro-cid-r4kjsmet": true })} <!-- Services --> ${renderComponent($$result, "DockButton", $$Dockbutton, { "tooltip": "Services", "icon": `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="7" height="7"/>
          <rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/>
        </svg>`, "onClick": "document.getElementById('services').scrollIntoView({behavior: 'smooth'})", "data-astro-cid-r4kjsmet": true })} <!-- Products --> ${renderComponent($$result, "DockButton", $$Dockbutton, { "tooltip": "Products", "icon": `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>`, "onClick": "document.getElementById('products').scrollIntoView({behavior: 'smooth'})", "data-astro-cid-r4kjsmet": true })} <!-- Process --> ${renderComponent($$result, "DockButton", $$Dockbutton, { "tooltip": "Process", "icon": `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9,11 12,14 22,4"/>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
        </svg>`, "onClick": "document.getElementById('process').scrollIntoView({behavior: 'smooth'})", "data-astro-cid-r4kjsmet": true })} <!-- Reviews --> ${renderComponent($$result, "DockButton", $$Dockbutton, { "tooltip": "Reviews", "icon": `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>`, "onClick": "document.getElementById('reviews').scrollIntoView({behavior: 'smooth'})", "data-astro-cid-r4kjsmet": true })} <!-- Chat --> ${renderComponent($$result, "DockButton", $$Dockbutton, { "tooltip": "Chat", "icon": `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 8V4H8"/>
          <rect width="16" height="12" x="4" y="8" rx="2"/>
          <path d="M2 14h2"/>
          <path d="M20 14h2"/>
          <path d="M15 13v2"/>
          <path d="M9 13v2"/>
        </svg>`, "variant": "chat", "id": "dockChatToggle", "data-astro-cid-r4kjsmet": true })} <!-- Divider --> <div class="w-px h-6 sm:h-8 bg-gradient-to-b from-transparent via-gray-400/30 dark:via-white/20 to-transparent md:hidden" data-astro-cid-r4kjsmet></div> <!-- Hamburger Menu --> ${renderComponent($$result, "DockButton", $$Dockbutton, { "tooltip": "Menu", "icon": `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>`, "id": "dockMenuToggle", "className": "md:hidden", "data-astro-cid-r4kjsmet": true })} </div> </div> </div>  ${renderScript($$result, "/Volumes/MannyKnows/MK/MannyKnows/src/components/navigation/DockMenu.astro?astro&type=script&index=0&lang.ts")}`;
    }, "/Volumes/MannyKnows/MK/MannyKnows/src/components/navigation/DockMenu.astro", void 0);
    $$Astro = createAstro();
    $$ChatBox = createComponent(async ($$result, $$props, $$slots) => {
      const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
      Astro2.self = $$ChatBox;
      const { className = "" } = Astro2.props;
      return renderTemplate`<!-- Chatting Hub -->${maybeRenderHead()}<div id="chatBox"${addAttribute(`chat-hub-container transform scale-0 transition-all duration-300 origin-bottom-center z-40 opacity-0 invisible ${className} chat-glassmorphism`, "class")} data-astro-cid-wqmercx5> <div class="flex justify-between items-center p-4 border-b border-white/20 dark:border-white/10" data-astro-cid-wqmercx5> <div class="flex items-center gap-3" data-astro-cid-wqmercx5> <div class="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center" data-astro-cid-wqmercx5> <span class="text-white font-bold text-lg" data-astro-cid-wqmercx5>M</span> </div> <div data-astro-cid-wqmercx5> <h3 class="text-text-light-primary dark:text-text-dark-primary m-0 text-lg font-semibold" data-astro-cid-wqmercx5>Chat with Manny</h3> <p class="text-text-light-secondary dark:text-text-dark-secondary m-0 text-sm" data-astro-cid-wqmercx5>Your MK solutions architect</p> </div> </div> <div class="flex items-center gap-2" data-astro-cid-wqmercx5> <button type="button" class="group bg-none border-none text-text-light-tertiary dark:text-text-dark-tertiary cursor-pointer p-2 rounded-md transition-all duration-300 flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 hover:text-text-light-primary dark:hover:text-text-dark-primary" id="chatBoxClear" title="Clear conversation" data-astro-cid-wqmercx5> <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-astro-cid-wqmercx5> <path d="M3 6h18" data-astro-cid-wqmercx5></path> <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" data-astro-cid-wqmercx5></path> <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" data-astro-cid-wqmercx5></path> </svg> </button> <button type="button" class="group bg-none border-none text-text-light-tertiary dark:text-text-dark-tertiary cursor-pointer p-2 rounded-md transition-all duration-300 flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 hover:text-text-light-primary dark:hover:text-text-dark-primary" id="chatBoxClose" data-astro-cid-wqmercx5> <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-astro-cid-wqmercx5> <line x1="18" y1="6" x2="6" y2="18" data-astro-cid-wqmercx5></line> <line x1="6" y1="6" x2="18" y2="18" data-astro-cid-wqmercx5></line> </svg> </button> </div> </div> <div class="flex flex-col chat-body" data-astro-cid-wqmercx5> <div class="flex-1 p-4 overflow-y-auto flex flex-col gap-3" id="chatBoxMessages" data-astro-cid-wqmercx5> <div class="flex gap-3 items-start" data-astro-cid-wqmercx5> <div class="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0" data-astro-cid-wqmercx5>M</div> <div class="chat-message-bubble bot-message" data-astro-cid-wqmercx5>
Hey there! I'm Manny 🤓 what challenge can I help you solve today?
</div> </div> </div> <div class="flex gap-3 p-4 border-t border-white/20 dark:border-white/10 chat-input-area" data-astro-cid-wqmercx5> <label for="chatBoxInput" class="sr-only" data-astro-cid-wqmercx5>Type your message</label> <input type="text" id="chatBoxInput" placeholder="Type your message..." class="flex-1 backdrop-blur-lg border rounded-lg py-3 px-4 text-text-light-primary dark:text-text-dark-primary text-sm transition-all duration-300 placeholder:text-text-light-tertiary dark:placeholder:text-text-dark-tertiary focus:outline-none chat-input" data-astro-cid-wqmercx5> <button type="button" id="chatBoxSend" class="bg-gradient-to-r from-green-500 to-emerald-500 border-none rounded-lg text-white w-12 h-12 flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-105 hover:from-emerald-500 hover:to-green-500" aria-label="Send message" data-astro-cid-wqmercx5> <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" data-astro-cid-wqmercx5> <line x1="22" y1="2" x2="11" y2="13" data-astro-cid-wqmercx5></line> <polygon points="22,2 15,22 11,13 2,9" data-astro-cid-wqmercx5></polygon> </svg> </button> </div> </div> </div> ${renderScript($$result, "/Volumes/MannyKnows/MK/MannyKnows/src/components/ui/ChatBox.astro?astro&type=script&index=0&lang.ts")} `;
    }, "/Volumes/MannyKnows/MK/MannyKnows/src/components/ui/ChatBox.astro", void 0);
  }
});

// dist/_worker.js/pages/404.astro.mjs
var astro_exports = {};
__export(astro_exports, {
  page: () => page2,
  renderers: () => renderers
});
var $$NotFoundSection, $$Astro2, $$404, $$file, $$url, _page2, page2;
var init_astro = __esm({
  "dist/_worker.js/pages/404.astro.mjs"() {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_server_BRKsKzpO();
    init_ChatBox_BTFFVlFh();
    init_renderers();
    globalThis.process ??= {};
    globalThis.process.env ??= {};
    $$NotFoundSection = createComponent(($$result, $$props, $$slots) => {
      return renderTemplate`${maybeRenderHead()}<section class="relative bg-gradient-to-br from-light-primary via-gray-50 to-light-secondary dark:from-dark-primary dark:via-gray-900 dark:to-dark-secondary min-h-screen flex items-center justify-center transition-colors duration-300"> <!-- Background decoration --> <div class="absolute inset-0 overflow-hidden"> <div class="absolute -top-20 -right-20 w-96 h-96 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full blur-3xl"></div> <div class="absolute -bottom-20 -left-20 w-96 h-96 bg-gradient-to-tr from-secondary/10 to-primary/10 rounded-full blur-3xl"></div> </div> <div class="relative z-10 text-center px-6 sm:px-8 lg:px-12 max-w-4xl mx-auto"> <!-- Large 404 --> <div class="mb-8"> <h1 class="text-8xl sm:text-9xl lg:text-[12rem] font-black bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent leading-none">
404
</h1> </div> <!-- Error message --> <div class="mb-12"> <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-text-light-primary dark:text-text-dark-primary mb-4">
Oops! Page Not Found
</h2> <p class="text-lg sm:text-xl text-text-light-secondary dark:text-text-dark-secondary max-w-2xl mx-auto leading-relaxed">
The page you're looking for seems to have vanished into the digital void. 
        Don't worry though – our AI is still here to help you navigate back to where you need to be!
</p> </div> <!-- Action buttons --> <div class="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16"> <!-- Primary CTA with glassmorphism --> <a href="/" class="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold backdrop-blur-lg border rounded-full transition-all duration-300 hover:scale-105 overflow-hidden bg-gradient-to-r from-primary to-secondary text-white border-primary/30" style="box-shadow: 0 4px 20px rgba(59, 130, 246, 0.2), 0 1px 3px rgba(59, 130, 246, 0.1);"> <!-- Enhanced glassmorphism overlay on hover --> <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(59, 130, 246, 0.05));"></div> <span class="mr-2 relative z-10">🏠</span> <span class="relative z-10">Back to Home</span> <svg class="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-x-1 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path> </svg> </a> <!-- Secondary CTA with glassmorphism and theme-aware styling --> <button onclick="document.querySelector('[data-chatbox]')?.scrollIntoView({ behavior: 'smooth' })" class="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold backdrop-blur-lg border rounded-full transition-all duration-300 hover:scale-105 overflow-hidden text-text-light-primary dark:text-text-dark-primary border-gray-200/30 dark:border-white/20" style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.08)); box-shadow: 0 4px 20px rgba(59, 130, 246, 0.2), 0 1px 3px rgba(59, 130, 246, 0.1);"> <!-- Enhanced glassmorphism overlay on hover --> <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(59, 130, 246, 0.05));"></div> <span class="mr-2 relative z-10">💬</span> <span class="relative z-10">Ask Manny AI</span> <svg class="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-x-1 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path> </svg> </button> </div> <!-- Popular links with glassmorphism styling --> <div class="border-t border-gray-200/30 dark:border-white/20 pt-12"> <h3 class="text-xl font-semibold text-text-light-primary dark:text-text-dark-primary mb-6">
Popular Destinations
</h3> <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto"> <a href="/#services" class="group backdrop-blur-lg border rounded-xl p-6 transition-all duration-300 hover:scale-105 hover:-translate-y-1 relative overflow-hidden text-text-light-primary dark:text-text-dark-primary border-gray-200/30 dark:border-white/20" style="background: linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.08)); box-shadow: 0 4px 20px rgba(34, 197, 94, 0.2), 0 1px 3px rgba(34, 197, 94, 0.1);"> <!-- Enhanced glassmorphism overlay on hover --> <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style="background: linear-gradient(135deg, rgba(34, 197, 94, 0.08), rgba(34, 197, 94, 0.05));"></div> <div class="relative z-10"> <div class="text-2xl mb-2">🚀</div> <h4 class="font-semibold mb-1">Services</h4> <p class="text-sm text-text-light-secondary dark:text-text-dark-secondary">Our AI solutions</p> </div> </a> <a href="/#process" class="group backdrop-blur-lg border rounded-xl p-6 transition-all duration-300 hover:scale-105 hover:-translate-y-1 relative overflow-hidden text-text-light-primary dark:text-text-dark-primary border-gray-200/30 dark:border-white/20" style="background: linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(168, 85, 247, 0.08)); box-shadow: 0 4px 20px rgba(168, 85, 247, 0.2), 0 1px 3px rgba(168, 85, 247, 0.1);"> <!-- Enhanced glassmorphism overlay on hover --> <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style="background: linear-gradient(135deg, rgba(168, 85, 247, 0.08), rgba(168, 85, 247, 0.05));"></div> <div class="relative z-10"> <div class="text-2xl mb-2">⚙️</div> <h4 class="font-semibold mb-1">Process</h4> <p class="text-sm text-text-light-secondary dark:text-text-dark-secondary">How we work</p> </div> </a> <a href="/#reviews" class="group backdrop-blur-lg border rounded-xl p-6 transition-all duration-300 hover:scale-105 hover:-translate-y-1 relative overflow-hidden text-text-light-primary dark:text-text-dark-primary border-gray-200/30 dark:border-white/20" style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.08)); box-shadow: 0 4px 20px rgba(59, 130, 246, 0.2), 0 1px 3px rgba(59, 130, 246, 0.1);"> <!-- Enhanced glassmorphism overlay on hover --> <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(59, 130, 246, 0.05));"></div> <div class="relative z-10"> <div class="text-2xl mb-2">⭐</div> <h4 class="font-semibold mb-1">Reviews</h4> <p class="text-sm text-text-light-secondary dark:text-text-dark-secondary">Client testimonials</p> </div> </a> <a href="/#products" class="group backdrop-blur-lg border rounded-xl p-6 transition-all duration-300 hover:scale-105 hover:-translate-y-1 relative overflow-hidden text-text-light-primary dark:text-text-dark-primary border-gray-200/30 dark:border-white/20" style="background: linear-gradient(135deg, rgba(236, 72, 153, 0.15), rgba(236, 72, 153, 0.08)); box-shadow: 0 4px 20px rgba(236, 72, 153, 0.2), 0 1px 3px rgba(236, 72, 153, 0.1);"> <!-- Enhanced glassmorphism overlay on hover --> <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style="background: linear-gradient(135deg, rgba(236, 72, 153, 0.08), rgba(236, 72, 153, 0.05));"></div> <div class="relative z-10"> <div class="text-2xl mb-2">💼</div> <h4 class="font-semibold mb-1">Products</h4> <p class="text-sm text-text-light-secondary dark:text-text-dark-secondary">Our offerings</p> </div> </a> </div> </div> <!-- Fun fact with glassmorphism --> <div class="mt-12 backdrop-blur-lg border rounded-2xl p-6 relative overflow-hidden border-gray-200/30 dark:border-white/20" style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.10), rgba(168, 85, 247, 0.08)); box-shadow: 0 4px 20px rgba(59, 130, 246, 0.15), 0 1px 3px rgba(59, 130, 246, 0.1);"> <!-- Subtle glassmorphism overlay --> <div class="absolute inset-0 opacity-50" style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(168, 85, 247, 0.03));"></div> <p class="text-sm text-text-light-secondary dark:text-text-dark-secondary relative z-10"> <span class="font-semibold">Fun fact:</span> HTTP 404 errors get their name from Room 404 at CERN, 
        where the original web servers were located. Now you know! 🤓
</p> </div> </div> </section>`;
    }, "/Volumes/MannyKnows/MK/MannyKnows/src/components/sections/NotFoundSection.astro", void 0);
    $$Astro2 = createAstro();
    $$404 = createComponent(($$result, $$props, $$slots) => {
      const Astro2 = $$result.createAstro($$Astro2, $$props, $$slots);
      Astro2.self = $$404;
      const NAVBAR_CONFIG = {
        // Search gradient animations in navbar
        searchGradientEnabled: true,
        searchScrollDelay: 0,
        // Debug mode for development
        debugMode: false
      };
      Astro2.response.status = 404;
      return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "404 - Page Not Found | MannyKnows - AI Solutions" }, { "default": /* @__PURE__ */ __name(($$result2) => renderTemplate` ${maybeRenderHead()}<main class="relative bg-light-primary dark:bg-dark-primary text-text-light-primary dark:text-text-dark-primary min-h-screen transition-colors duration-300"> <!-- Marquee Announcement Section --> ${renderComponent($$result2, "MarqueeSimple", $$MarqueeSimple, {})} <!-- Header Container with Subtle Background --> <header class="relative bg-gradient-to-t from-gray-50/50 via-gray-100/30 to-gray-50/20 dark:from-gray-900/60 dark:via-slate-800/40 dark:to-gray-900/30 transition-colors duration-300"> <!-- Navigation --> ${renderComponent($$result2, "NavBar", $$NavBar, { "animationConfig": {
        searchGradientEnabled: NAVBAR_CONFIG.searchGradientEnabled,
        debugMode: NAVBAR_CONFIG.debugMode,
        searchScrollDelay: NAVBAR_CONFIG.searchScrollDelay
      } })} </header> <!-- 404 Section (replaces hero, services, etc.) --> ${renderComponent($$result2, "NotFoundSection", $$NotFoundSection, {})} <!-- Chat Box (keep this for user support) --> ${renderComponent($$result2, "ChatBox", $$ChatBox, {})} <!-- Floating Dock Menu --> ${renderComponent($$result2, "DockMenu", $$DockMenu, {})} </main> `, "default") })}`;
    }, "/Volumes/MannyKnows/MK/MannyKnows/src/pages/404.astro", void 0);
    $$file = "/Volumes/MannyKnows/MK/MannyKnows/src/pages/404.astro";
    $$url = "/404";
    _page2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
      __proto__: null,
      default: $$404,
      file: $$file,
      url: $$url
    }, Symbol.toStringTag, { value: "Module" }));
    page2 = /* @__PURE__ */ __name(() => _page2, "page");
  }
});

// dist/_worker.js/pages/api/calendar-health.astro.mjs
var calendar_health_astro_exports = {};
__export(calendar_health_astro_exports, {
  page: () => page3,
  renderers: () => renderers
});
var prerender2, GET2, POST, _page3, page3;
var init_calendar_health_astro = __esm({
  "dist/_worker.js/pages/api/calendar-health.astro.mjs"() {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_renderers();
    globalThis.process ??= {};
    globalThis.process.env ??= {};
    prerender2 = false;
    GET2 = /* @__PURE__ */ __name(async () => {
      return new Response(JSON.stringify({ ok: false, error: "calendar-health removed: Google Calendar integration has been decommissioned." }), {
        status: 410,
        headers: { "Content-Type": "application/json" }
      });
    }, "GET");
    POST = GET2;
    _page3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
      __proto__: null,
      GET: GET2,
      POST,
      prerender: prerender2
    }, Symbol.toStringTag, { value: "Module" }));
    page3 = /* @__PURE__ */ __name(() => _page3, "page");
  }
});

// dist/_worker.js/chunks/kvEncryption_B8t-dpS8.mjs
var RateLimiter, DomainValidator, CSRFProtection, KVEncryption, EncryptedKV;
var init_kvEncryption_B8t_dpS8 = __esm({
  "dist/_worker.js/chunks/kvEncryption_B8t-dpS8.mjs"() {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    globalThis.process ??= {};
    globalThis.process.env ??= {};
    RateLimiter = class {
      static {
        __name(this, "RateLimiter");
      }
      kv;
      tiers;
      constructor(kv) {
        this.kv = kv;
        this.tiers = {
          anonymous: {
            windowMs: 60 * 1e3,
            // 1 minute
            maxRequests: 30,
            message: "Rate limit exceeded. Please wait before sending more messages."
          },
          verified: {
            windowMs: 60 * 1e3,
            // 1 minute  
            maxRequests: 60,
            message: "Rate limit exceeded for verified users."
          },
          premium: {
            windowMs: 60 * 1e3,
            // 1 minute
            maxRequests: 120,
            message: "Rate limit exceeded for premium users."
          },
          admin: {
            windowMs: 60 * 1e3,
            // 1 minute
            maxRequests: 1e3,
            // Effectively unlimited
            message: "Admin rate limit exceeded."
          }
        };
      }
      /**
       * Check rate limit for a client
       */
      async checkRateLimit(clientIP, userTier = "anonymous") {
        const config2 = this.tiers[userTier];
        const now = Date.now();
        const windowStart = Math.floor(now / config2.windowMs) * config2.windowMs;
        const key = `rate_limit:${userTier}:${clientIP}:${windowStart}`;
        try {
          const currentCountStr = await this.kv.get(key);
          const currentCount = currentCountStr ? parseInt(currentCountStr) : 0;
          if (currentCount >= config2.maxRequests) {
            const resetTime = windowStart + config2.windowMs;
            return {
              allowed: false,
              remaining: 0,
              resetTime,
              tier: userTier
            };
          }
          const newCount = currentCount + 1;
          const ttl = Math.ceil((windowStart + config2.windowMs - now) / 1e3);
          await this.kv.put(key, newCount.toString(), { expirationTtl: ttl });
          return {
            allowed: true,
            remaining: config2.maxRequests - newCount,
            resetTime: windowStart + config2.windowMs,
            tier: userTier
          };
        } catch (error4) {
          console.error("Rate limiter error:", error4);
          return {
            allowed: true,
            remaining: config2.maxRequests,
            resetTime: windowStart + config2.windowMs,
            tier: userTier
          };
        }
      }
      /**
       * Get rate limit headers for HTTP responses
       */
      getRateLimitHeaders(result) {
        return {
          "X-RateLimit-Limit": this.tiers[result.tier].maxRequests.toString(),
          "X-RateLimit-Remaining": result.remaining.toString(),
          "X-RateLimit-Reset": Math.ceil(result.resetTime / 1e3).toString(),
          "X-RateLimit-Tier": result.tier
        };
      }
      /**
       * Create rate limit error response
       */
      createRateLimitResponse(result) {
        const config2 = this.tiers[result.tier];
        const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1e3);
        return new Response(JSON.stringify({
          error: config2.message,
          retryAfter,
          tier: result.tier,
          resetTime: result.resetTime
        }), {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": retryAfter.toString(),
            ...this.getRateLimitHeaders(result)
          }
        });
      }
      /**
       * Determine user tier based on session/profile data
       */
      static getUserTier(profile3, sessionData) {
        if (sessionData?.isAdmin) {
          return "admin";
        }
        if (profile3?.tier === "premium" || profile3?.premiumServicesUsed?.length > 0) {
          return "premium";
        }
        if (profile3?.verified || profile3?.trustScore > 50) {
          return "verified";
        }
        return "anonymous";
      }
    };
    DomainValidator = class {
      static {
        __name(this, "DomainValidator");
      }
      config;
      constructor(config2) {
        this.config = {
          allowedOrigins: [
            "https://mannyknows.com",
            "https://www.mannyknows.com",
            "http://localhost:4321",
            // Development
            "http://localhost:3000",
            // Development
            "http://localhost:8787",
            // Wrangler dev
            "http://127.0.0.1:4321"
            // Development
          ],
          allowedReferers: [
            "https://mannyknows.com/",
            "https://www.mannyknows.com/",
            "http://localhost:4321/",
            // Development
            "http://localhost:3000/",
            // Development
            "http://localhost:8787/",
            // Wrangler dev
            "http://127.0.0.1:4321/"
            // Development
          ],
          blockUnknownOrigins: true,
          enforceReferer: false,
          // Can be strict for sensitive operations
          ...config2
        };
      }
      /**
       * Validate request origin and referer
       */
      validateRequest(request) {
        const origin = request.headers.get("origin");
        const referer = request.headers.get("referer");
        if (origin) {
          if (!this.isAllowedOrigin(origin)) {
            return {
              valid: false,
              reason: "Invalid origin",
              origin,
              referer: referer || void 0
            };
          }
        } else if (this.config.blockUnknownOrigins) {
          if (request.method !== "GET") {
            return {
              valid: false,
              reason: "Missing origin header",
              referer: referer || void 0
            };
          }
        }
        if (this.config.enforceReferer && referer) {
          if (!this.isAllowedReferer(referer)) {
            return {
              valid: false,
              reason: "Invalid referer",
              origin: origin || void 0,
              referer
            };
          }
        }
        return {
          valid: true,
          origin: origin || void 0,
          referer: referer || void 0
        };
      }
      /**
       * Check if origin is allowed
       */
      isAllowedOrigin(origin) {
        if (this.config.allowedOrigins.includes(origin)) {
          return true;
        }
        if (this.isDevelopment()) {
          const localhostPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
          if (localhostPattern.test(origin)) {
            return true;
          }
        }
        return false;
      }
      /**
       * Check if referer is allowed
       */
      isAllowedReferer(referer) {
        return this.config.allowedReferers.some(
          (allowed) => referer.startsWith(allowed)
        );
      }
      /**
       * Check if we're in development mode
       */
      isDevelopment() {
        return typeof process !== "undefined" && false;
      }
      /**
       * Create CORS headers for allowed origins
       */
      getCORSHeaders(requestOrigin) {
        const headers = {
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
          "Access-Control-Max-Age": "86400"
          // 24 hours
        };
        if (requestOrigin && this.isAllowedOrigin(requestOrigin)) {
          headers["Access-Control-Allow-Origin"] = requestOrigin;
        } else {
          headers["Access-Control-Allow-Origin"] = this.config.allowedOrigins[0];
        }
        return headers;
      }
      /**
       * Create error response for invalid domain
       */
      createDomainErrorResponse(validation) {
        return new Response(JSON.stringify({
          error: "Access denied: Invalid domain or origin",
          reason: validation.reason,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }), {
          status: 403,
          headers: {
            "Content-Type": "application/json",
            "X-Blocked-Reason": validation.reason || "Unknown"
          }
        });
      }
      /**
       * Log security violation
       */
      async logSecurityViolation(validation, request, kv) {
        const logData = {
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          type: "DOMAIN_VIOLATION",
          reason: validation.reason,
          origin: validation.origin,
          referer: validation.referer,
          ip: request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For") || "unknown",
          userAgent: request.headers.get("User-Agent") || "unknown",
          method: request.method,
          url: request.url
        };
        if (this.isDevelopment()) {
          console.warn("\u{1F6A8} Domain Security Violation:", logData);
        }
        if (kv) {
          try {
            const logKey = `security_log:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
            await kv.put(logKey, JSON.stringify(logData), { expirationTtl: 604800 });
          } catch (error4) {
            console.error("Failed to log security violation:", error4);
          }
        }
      }
      /**
       * Public methods for security status monitoring
       */
      getAllowedDomains() {
        return [...this.config.allowedOrigins];
      }
      isDevMode() {
        return this.isDevelopment();
      }
    };
    CSRFProtection = class {
      static {
        __name(this, "CSRFProtection");
      }
      kv;
      config;
      constructor(kv, config2) {
        this.kv = kv;
        this.config = {
          tokenLength: 32,
          sessionTimeout: 36e5,
          // 1 hour
          enforceHTTPS: true,
          requireDoubleSubmit: false,
          ...config2
        };
      }
      /**
       * Generate a new CSRF token for a session
       */
      async generateToken(sessionId) {
        const token = this.createRandomToken();
        const now = Date.now();
        const csrfData = {
          token,
          created: now,
          sessionId,
          expires: now + this.config.sessionTimeout
        };
        const key = `csrf:${token}`;
        const ttl = Math.ceil(this.config.sessionTimeout / 1e3);
        await this.kv.put(key, JSON.stringify(csrfData), { expirationTtl: ttl });
        const sessionKey = `csrf_session:${sessionId}`;
        await this.kv.put(sessionKey, token, { expirationTtl: ttl });
        return token;
      }
      /**
       * Validate a CSRF token
       */
      async validateToken(token, sessionId, request) {
        if (!token) {
          return { valid: false, reason: "Missing CSRF token" };
        }
        if (this.config.enforceHTTPS && request) {
          const url = new URL(request.url);
          const protocol = request.headers.get("x-forwarded-proto") || url.protocol;
          const hostname = url.hostname;
          const isLocalDev = hostname === "localhost" || hostname === "127.0.0.1" || hostname.includes(".local");
          if (protocol !== "https:" && !isLocalDev) {
            return { valid: false, reason: "CSRF token requires HTTPS" };
          }
        }
        try {
          const key = `csrf:${token}`;
          const tokenDataStr = await this.kv.get(key);
          if (!tokenDataStr) {
            return { valid: false, reason: "Invalid or expired CSRF token" };
          }
          const tokenData = JSON.parse(tokenDataStr);
          if (Date.now() > tokenData.expires) {
            await this.kv.delete(key);
            return { valid: false, reason: "CSRF token expired" };
          }
          if (tokenData.sessionId !== sessionId) {
            return { valid: false, reason: "CSRF token session mismatch" };
          }
          return { valid: true };
        } catch (error4) {
          console.error("CSRF validation error:", error4);
          return { valid: false, reason: "CSRF validation failed" };
        }
      }
      /**
       * Create CSRF middleware for API routes
       */
      async validateRequest(request, sessionId) {
        if (!this.requiresCSRFValidation(request.method)) {
          return { valid: true };
        }
        let token;
        token = request.headers.get("x-csrf-token") || void 0;
        if (!token && request.headers.get("content-type")?.includes("application/json")) {
          try {
            const body = await request.clone().json();
            token = body.csrf_token;
          } catch (e) {
          }
        }
        if (!token) {
          return { valid: false, reason: "CSRF token missing from request" };
        }
        const validation = await this.validateToken(token, sessionId, request);
        return { ...validation, token };
      }
      /**
       * Get or create CSRF token for session
       */
      async getSessionToken(sessionId) {
        try {
          const sessionKey = `csrf_session:${sessionId}`;
          const existingToken = await this.kv.get(sessionKey);
          if (existingToken) {
            const validation = await this.validateToken(existingToken, sessionId);
            if (validation.valid) {
              return existingToken;
            }
          }
          return await this.generateToken(sessionId);
        } catch (error4) {
          console.error("Error getting session token:", error4);
          return await this.generateToken(sessionId);
        }
      }
      /**
       * Clean up expired tokens for a session
       */
      async cleanupSession(sessionId) {
        try {
          const sessionKey = `csrf_session:${sessionId}`;
          const token = await this.kv.get(sessionKey);
          if (token) {
            await this.kv.delete(`csrf:${token}`);
            await this.kv.delete(sessionKey);
          }
        } catch (error4) {
          console.error("Error cleaning up CSRF session:", error4);
        }
      }
      /**
       * Create CSRF error response
       */
      createCSRFErrorResponse(reason) {
        return new Response(JSON.stringify({
          error: "CSRF Protection: Request blocked",
          reason,
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          helpMessage: "This request was blocked for security reasons. Please refresh the page and try again."
        }), {
          status: 403,
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Protection": "blocked"
          }
        });
      }
      /**
       * Generate client-side CSRF helper script
       */
      generateClientScript(token) {
        return `
      // CSRF Protection Client Helper
      window.MannyKnowsCSRF = {
        token: '${token}',
        
        // Add CSRF token to fetch requests
        fetch: function(url, options = {}) {
          const headers = options.headers || {};
          headers['X-CSRF-Token'] = this.token;
          return fetch(url, { ...options, headers });
        },
        
        // Add CSRF token to form data
        addToForm: function(formData) {
          formData.append('csrf_token', this.token);
          return formData;
        },
        
        // Add CSRF token to JSON payloads
        addToJSON: function(data) {
          return { ...data, csrf_token: this.token };
        }
      };
    `;
      }
      /**
       * Helper methods
       */
      createRandomToken() {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let result = "";
        for (let i = 0; i < this.config.tokenLength; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      }
      requiresCSRFValidation(method) {
        return ["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase());
      }
    };
    KVEncryption = class {
      static {
        __name(this, "KVEncryption");
      }
      config;
      encryptionKey;
      constructor(encryptionKey, config2) {
        this.encryptionKey = encryptionKey;
        this.config = {
          algorithm: "AES-GCM",
          keyDerivationRounds: 1e5,
          saltLength: 16,
          ivLength: 12,
          ...config2
        };
      }
      /**
       * Encrypt data for KV storage
       */
      async encrypt(data) {
        try {
          const plaintext = typeof data === "string" ? data : JSON.stringify(data);
          const encoder2 = new TextEncoder();
          const plaintextBuffer = encoder2.encode(plaintext);
          const salt = new Uint8Array(this.config.saltLength);
          const iv = new Uint8Array(this.config.ivLength);
          crypto.getRandomValues(salt);
          crypto.getRandomValues(iv);
          const keyMaterial = await this.deriveKey(this.encryptionKey, salt);
          const encryptedBuffer = await crypto.subtle.encrypt(
            {
              name: this.config.algorithm,
              iv
            },
            keyMaterial,
            plaintextBuffer
          );
          const encryptedData = {
            data: this.arrayBufferToBase64(encryptedBuffer),
            salt: this.uint8ArrayToBase64(salt),
            iv: this.uint8ArrayToBase64(iv),
            algorithm: this.config.algorithm,
            timestamp: Date.now()
          };
          return JSON.stringify(encryptedData);
        } catch (error4) {
          console.error("Encryption error:", error4);
          throw new Error("Failed to encrypt data");
        }
      }
      /**
       * Decrypt data from KV storage
       */
      async decrypt(encryptedString) {
        try {
          const encryptedData = JSON.parse(encryptedString);
          const encryptedBuffer = this.base64ToArrayBuffer(encryptedData.data);
          const salt = this.base64ToUint8Array(encryptedData.salt);
          const iv = this.base64ToUint8Array(encryptedData.iv);
          const keyMaterial = await this.deriveKey(this.encryptionKey, salt);
          const decryptedBuffer = await crypto.subtle.decrypt(
            {
              name: encryptedData.algorithm,
              iv
            },
            keyMaterial,
            encryptedBuffer
          );
          const decoder2 = new TextDecoder();
          const plaintext = decoder2.decode(decryptedBuffer);
          try {
            return JSON.parse(plaintext);
          } catch {
            return plaintext;
          }
        } catch (error4) {
          console.error("Decryption error:", error4);
          throw new Error("Failed to decrypt data");
        }
      }
      /**
       * Derive encryption key from password and salt
       */
      async deriveKey(password, salt) {
        const encoder2 = new TextEncoder();
        const passwordBuffer = encoder2.encode(password);
        const keyMaterial = await crypto.subtle.importKey(
          "raw",
          passwordBuffer,
          { name: "PBKDF2" },
          false,
          ["deriveKey"]
        );
        return await crypto.subtle.deriveKey(
          {
            name: "PBKDF2",
            salt,
            iterations: this.config.keyDerivationRounds,
            hash: "SHA-256"
          },
          keyMaterial,
          {
            name: this.config.algorithm,
            length: 256
          },
          false,
          ["encrypt", "decrypt"]
        );
      }
      /**
       * Helper methods for base64 encoding/decoding
       */
      arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary2 = "";
        for (let i = 0; i < bytes.byteLength; i++) {
          binary2 += String.fromCharCode(bytes[i]);
        }
        return btoa(binary2);
      }
      base64ToArrayBuffer(base64) {
        const binary2 = atob(base64);
        const bytes = new Uint8Array(binary2.length);
        for (let i = 0; i < binary2.length; i++) {
          bytes[i] = binary2.charCodeAt(i);
        }
        return bytes.buffer;
      }
      uint8ArrayToBase64(array) {
        let binary2 = "";
        for (let i = 0; i < array.byteLength; i++) {
          binary2 += String.fromCharCode(array[i]);
        }
        return btoa(binary2);
      }
      base64ToUint8Array(base64) {
        const binary2 = atob(base64);
        const bytes = new Uint8Array(binary2.length);
        for (let i = 0; i < binary2.length; i++) {
          bytes[i] = binary2.charCodeAt(i);
        }
        return bytes;
      }
    };
    EncryptedKV = class {
      static {
        __name(this, "EncryptedKV");
      }
      kv;
      encryption;
      sensitiveKeyPatterns;
      constructor(kv, encryptionKey, sensitivePatterns) {
        this.kv = kv;
        this.encryption = new KVEncryption(encryptionKey);
        const defaultPatterns = [
          "session:.*",
          "user:.*:profile",
          "user:.*:email",
          "auth:.*",
          "token:.*",
          "verification:.*",
          "payment:.*",
          "personal:.*"
        ];
        const patterns = sensitivePatterns || defaultPatterns;
        this.sensitiveKeyPatterns = patterns.map((pattern) => new RegExp(pattern));
      }
      /**
       * Check if a key contains sensitive data
       */
      isSensitiveKey(key) {
        return this.sensitiveKeyPatterns.some((pattern) => pattern.test(key));
      }
      /**
       * Put data with automatic encryption for sensitive keys
       */
      async put(key, value, options) {
        try {
          let finalValue = value;
          if (this.isSensitiveKey(key)) {
            finalValue = await this.encryption.encrypt(value);
            options = {
              ...options,
              metadata: {
                ...options?.metadata || {},
                encrypted: true,
                encryptionVersion: "1.0"
              }
            };
          }
          return await this.kv.put(key, finalValue, options);
        } catch (error4) {
          console.error("EncryptedKV put error:", error4);
          throw error4;
        }
      }
      /**
       * Get data with automatic decryption for sensitive keys
       */
      async get(key, options) {
        try {
          const result = await this.kv.get(key, options);
          if (result === null || result === void 0) {
            return result;
          }
          if (this.isSensitiveKey(key)) {
            try {
              return await this.encryption.decrypt(result);
            } catch (decryptionError) {
              console.error("Decryption failed for key:", key, decryptionError);
              return null;
            }
          }
          return result;
        } catch (error4) {
          console.error("EncryptedKV get error:", error4);
          throw error4;
        }
      }
      /**
       * Delete key
       */
      async delete(key) {
        return await this.kv.delete(key);
      }
      /**
       * List keys with optional encryption status
       */
      async list(options) {
        const result = await this.kv.list(options);
        if (result.keys) {
          result.keys = result.keys.map((keyInfo) => ({
            ...keyInfo,
            encrypted: this.isSensitiveKey(keyInfo.name)
          }));
        }
        return result;
      }
      /**
       * Migrate existing unencrypted sensitive data to encrypted format
       */
      async migrateToEncryption(keyPattern) {
        let migrated = 0;
        let errors = 0;
        try {
          const allKeys = await this.kv.list();
          for (const keyInfo of allKeys.keys || []) {
            const key = keyInfo.name;
            if (this.isSensitiveKey(key) || keyPattern && keyPattern.test(key)) {
              try {
                const currentValue = await this.kv.get(key);
                if (currentValue !== null && currentValue !== void 0) {
                  try {
                    const parsed = JSON.parse(currentValue);
                    if (parsed.data && parsed.salt && parsed.iv && parsed.algorithm) {
                      continue;
                    }
                  } catch {
                  }
                  const encryptedValue = await this.encryption.encrypt(currentValue);
                  await this.kv.put(key, encryptedValue, {
                    metadata: {
                      encrypted: true,
                      encryptionVersion: "1.0",
                      migrated: true,
                      migratedAt: (/* @__PURE__ */ new Date()).toISOString()
                    }
                  });
                  migrated++;
                }
              } catch (error4) {
                console.error(`Failed to migrate key ${key}:`, error4);
                errors++;
              }
            }
          }
        } catch (error4) {
          console.error("Migration error:", error4);
          errors++;
        }
        return { migrated, errors };
      }
      /**
       * Backup encrypted data (exports encrypted format)
       */
      async backup(keyPattern) {
        const backup = {};
        try {
          const allKeys = await this.kv.list();
          for (const keyInfo of allKeys.keys || []) {
            const key = keyInfo.name;
            if (!keyPattern || keyPattern.test(key)) {
              const value = await this.kv.get(key);
              if (value !== null && value !== void 0) {
                backup[key] = {
                  value,
                  metadata: keyInfo.metadata,
                  encrypted: this.isSensitiveKey(key)
                };
              }
            }
          }
        } catch (error4) {
          console.error("Backup error:", error4);
          throw error4;
        }
        return backup;
      }
      /**
       * Get encryption statistics
       */
      async getEncryptionStats() {
        let totalKeys = 0;
        let encryptedKeys = 0;
        let unencryptedSensitiveKeys = 0;
        try {
          const allKeys = await this.kv.list();
          totalKeys = allKeys.keys?.length || 0;
          for (const keyInfo of allKeys.keys || []) {
            const key = keyInfo.name;
            const isSensitive = this.isSensitiveKey(key);
            if (isSensitive) {
              try {
                const value = await this.kv.get(key);
                if (value) {
                  try {
                    const parsed = JSON.parse(value);
                    if (parsed.data && parsed.salt && parsed.iv && parsed.algorithm) {
                      encryptedKeys++;
                    } else {
                      unencryptedSensitiveKeys++;
                    }
                  } catch {
                    unencryptedSensitiveKeys++;
                  }
                }
              } catch {
                unencryptedSensitiveKeys++;
              }
            }
          }
        } catch (error4) {
          console.error("Stats error:", error4);
        }
        const sensitiveKeys = encryptedKeys + unencryptedSensitiveKeys;
        const encryptionCoverage = sensitiveKeys > 0 ? encryptedKeys / sensitiveKeys * 100 : 100;
        return {
          totalKeys,
          encryptedKeys,
          unencryptedSensitiveKeys,
          encryptionCoverage
        };
      }
    };
  }
});

// node_modules/unenv/dist/runtime/node/internal/fs/promises.mjs
var access, copyFile, cp, open, opendir, rename, truncate, rm, rmdir, mkdir, readdir, readlink, symlink, lstat, stat, link, unlink, chmod, lchmod, lchown, chown, utimes, lutimes, realpath, mkdtemp, writeFile, appendFile, readFile, watch2, statfs, glob;
var init_promises = __esm({
  "node_modules/unenv/dist/runtime/node/internal/fs/promises.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_utils();
    access = /* @__PURE__ */ notImplemented("fs.access");
    copyFile = /* @__PURE__ */ notImplemented("fs.copyFile");
    cp = /* @__PURE__ */ notImplemented("fs.cp");
    open = /* @__PURE__ */ notImplemented("fs.open");
    opendir = /* @__PURE__ */ notImplemented("fs.opendir");
    rename = /* @__PURE__ */ notImplemented("fs.rename");
    truncate = /* @__PURE__ */ notImplemented("fs.truncate");
    rm = /* @__PURE__ */ notImplemented("fs.rm");
    rmdir = /* @__PURE__ */ notImplemented("fs.rmdir");
    mkdir = /* @__PURE__ */ notImplemented("fs.mkdir");
    readdir = /* @__PURE__ */ notImplemented("fs.readdir");
    readlink = /* @__PURE__ */ notImplemented("fs.readlink");
    symlink = /* @__PURE__ */ notImplemented("fs.symlink");
    lstat = /* @__PURE__ */ notImplemented("fs.lstat");
    stat = /* @__PURE__ */ notImplemented("fs.stat");
    link = /* @__PURE__ */ notImplemented("fs.link");
    unlink = /* @__PURE__ */ notImplemented("fs.unlink");
    chmod = /* @__PURE__ */ notImplemented("fs.chmod");
    lchmod = /* @__PURE__ */ notImplemented("fs.lchmod");
    lchown = /* @__PURE__ */ notImplemented("fs.lchown");
    chown = /* @__PURE__ */ notImplemented("fs.chown");
    utimes = /* @__PURE__ */ notImplemented("fs.utimes");
    lutimes = /* @__PURE__ */ notImplemented("fs.lutimes");
    realpath = /* @__PURE__ */ notImplemented("fs.realpath");
    mkdtemp = /* @__PURE__ */ notImplemented("fs.mkdtemp");
    writeFile = /* @__PURE__ */ notImplemented("fs.writeFile");
    appendFile = /* @__PURE__ */ notImplemented("fs.appendFile");
    readFile = /* @__PURE__ */ notImplemented("fs.readFile");
    watch2 = /* @__PURE__ */ notImplemented("fs.watch");
    statfs = /* @__PURE__ */ notImplemented("fs.statfs");
    glob = /* @__PURE__ */ notImplemented("fs.glob");
  }
});

// node_modules/unenv/dist/runtime/node/internal/fs/constants.mjs
var constants_exports = {};
__export(constants_exports, {
  COPYFILE_EXCL: () => COPYFILE_EXCL,
  COPYFILE_FICLONE: () => COPYFILE_FICLONE,
  COPYFILE_FICLONE_FORCE: () => COPYFILE_FICLONE_FORCE,
  EXTENSIONLESS_FORMAT_JAVASCRIPT: () => EXTENSIONLESS_FORMAT_JAVASCRIPT,
  EXTENSIONLESS_FORMAT_WASM: () => EXTENSIONLESS_FORMAT_WASM,
  F_OK: () => F_OK,
  O_APPEND: () => O_APPEND,
  O_CREAT: () => O_CREAT,
  O_DIRECT: () => O_DIRECT,
  O_DIRECTORY: () => O_DIRECTORY,
  O_DSYNC: () => O_DSYNC,
  O_EXCL: () => O_EXCL,
  O_NOATIME: () => O_NOATIME,
  O_NOCTTY: () => O_NOCTTY,
  O_NOFOLLOW: () => O_NOFOLLOW,
  O_NONBLOCK: () => O_NONBLOCK,
  O_RDONLY: () => O_RDONLY,
  O_RDWR: () => O_RDWR,
  O_SYNC: () => O_SYNC,
  O_TRUNC: () => O_TRUNC,
  O_WRONLY: () => O_WRONLY,
  R_OK: () => R_OK,
  S_IFBLK: () => S_IFBLK,
  S_IFCHR: () => S_IFCHR,
  S_IFDIR: () => S_IFDIR,
  S_IFIFO: () => S_IFIFO,
  S_IFLNK: () => S_IFLNK,
  S_IFMT: () => S_IFMT,
  S_IFREG: () => S_IFREG,
  S_IFSOCK: () => S_IFSOCK,
  S_IRGRP: () => S_IRGRP,
  S_IROTH: () => S_IROTH,
  S_IRUSR: () => S_IRUSR,
  S_IRWXG: () => S_IRWXG,
  S_IRWXO: () => S_IRWXO,
  S_IRWXU: () => S_IRWXU,
  S_IWGRP: () => S_IWGRP,
  S_IWOTH: () => S_IWOTH,
  S_IWUSR: () => S_IWUSR,
  S_IXGRP: () => S_IXGRP,
  S_IXOTH: () => S_IXOTH,
  S_IXUSR: () => S_IXUSR,
  UV_DIRENT_BLOCK: () => UV_DIRENT_BLOCK,
  UV_DIRENT_CHAR: () => UV_DIRENT_CHAR,
  UV_DIRENT_DIR: () => UV_DIRENT_DIR,
  UV_DIRENT_FIFO: () => UV_DIRENT_FIFO,
  UV_DIRENT_FILE: () => UV_DIRENT_FILE,
  UV_DIRENT_LINK: () => UV_DIRENT_LINK,
  UV_DIRENT_SOCKET: () => UV_DIRENT_SOCKET,
  UV_DIRENT_UNKNOWN: () => UV_DIRENT_UNKNOWN,
  UV_FS_COPYFILE_EXCL: () => UV_FS_COPYFILE_EXCL,
  UV_FS_COPYFILE_FICLONE: () => UV_FS_COPYFILE_FICLONE,
  UV_FS_COPYFILE_FICLONE_FORCE: () => UV_FS_COPYFILE_FICLONE_FORCE,
  UV_FS_O_FILEMAP: () => UV_FS_O_FILEMAP,
  UV_FS_SYMLINK_DIR: () => UV_FS_SYMLINK_DIR,
  UV_FS_SYMLINK_JUNCTION: () => UV_FS_SYMLINK_JUNCTION,
  W_OK: () => W_OK,
  X_OK: () => X_OK
});
var UV_FS_SYMLINK_DIR, UV_FS_SYMLINK_JUNCTION, O_RDONLY, O_WRONLY, O_RDWR, UV_DIRENT_UNKNOWN, UV_DIRENT_FILE, UV_DIRENT_DIR, UV_DIRENT_LINK, UV_DIRENT_FIFO, UV_DIRENT_SOCKET, UV_DIRENT_CHAR, UV_DIRENT_BLOCK, EXTENSIONLESS_FORMAT_JAVASCRIPT, EXTENSIONLESS_FORMAT_WASM, S_IFMT, S_IFREG, S_IFDIR, S_IFCHR, S_IFBLK, S_IFIFO, S_IFLNK, S_IFSOCK, O_CREAT, O_EXCL, UV_FS_O_FILEMAP, O_NOCTTY, O_TRUNC, O_APPEND, O_DIRECTORY, O_NOATIME, O_NOFOLLOW, O_SYNC, O_DSYNC, O_DIRECT, O_NONBLOCK, S_IRWXU, S_IRUSR, S_IWUSR, S_IXUSR, S_IRWXG, S_IRGRP, S_IWGRP, S_IXGRP, S_IRWXO, S_IROTH, S_IWOTH, S_IXOTH, F_OK, R_OK, W_OK, X_OK, UV_FS_COPYFILE_EXCL, COPYFILE_EXCL, UV_FS_COPYFILE_FICLONE, COPYFILE_FICLONE, UV_FS_COPYFILE_FICLONE_FORCE, COPYFILE_FICLONE_FORCE;
var init_constants = __esm({
  "node_modules/unenv/dist/runtime/node/internal/fs/constants.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    UV_FS_SYMLINK_DIR = 1;
    UV_FS_SYMLINK_JUNCTION = 2;
    O_RDONLY = 0;
    O_WRONLY = 1;
    O_RDWR = 2;
    UV_DIRENT_UNKNOWN = 0;
    UV_DIRENT_FILE = 1;
    UV_DIRENT_DIR = 2;
    UV_DIRENT_LINK = 3;
    UV_DIRENT_FIFO = 4;
    UV_DIRENT_SOCKET = 5;
    UV_DIRENT_CHAR = 6;
    UV_DIRENT_BLOCK = 7;
    EXTENSIONLESS_FORMAT_JAVASCRIPT = 0;
    EXTENSIONLESS_FORMAT_WASM = 1;
    S_IFMT = 61440;
    S_IFREG = 32768;
    S_IFDIR = 16384;
    S_IFCHR = 8192;
    S_IFBLK = 24576;
    S_IFIFO = 4096;
    S_IFLNK = 40960;
    S_IFSOCK = 49152;
    O_CREAT = 64;
    O_EXCL = 128;
    UV_FS_O_FILEMAP = 0;
    O_NOCTTY = 256;
    O_TRUNC = 512;
    O_APPEND = 1024;
    O_DIRECTORY = 65536;
    O_NOATIME = 262144;
    O_NOFOLLOW = 131072;
    O_SYNC = 1052672;
    O_DSYNC = 4096;
    O_DIRECT = 16384;
    O_NONBLOCK = 2048;
    S_IRWXU = 448;
    S_IRUSR = 256;
    S_IWUSR = 128;
    S_IXUSR = 64;
    S_IRWXG = 56;
    S_IRGRP = 32;
    S_IWGRP = 16;
    S_IXGRP = 8;
    S_IRWXO = 7;
    S_IROTH = 4;
    S_IWOTH = 2;
    S_IXOTH = 1;
    F_OK = 0;
    R_OK = 4;
    W_OK = 2;
    X_OK = 1;
    UV_FS_COPYFILE_EXCL = 1;
    COPYFILE_EXCL = 1;
    UV_FS_COPYFILE_FICLONE = 2;
    COPYFILE_FICLONE = 2;
    UV_FS_COPYFILE_FICLONE_FORCE = 4;
    COPYFILE_FICLONE_FORCE = 4;
  }
});

// node_modules/unenv/dist/runtime/node/fs/promises.mjs
var promises_exports = {};
__export(promises_exports, {
  access: () => access,
  appendFile: () => appendFile,
  chmod: () => chmod,
  chown: () => chown,
  constants: () => constants_exports,
  copyFile: () => copyFile,
  cp: () => cp,
  default: () => promises_default,
  glob: () => glob,
  lchmod: () => lchmod,
  lchown: () => lchown,
  link: () => link,
  lstat: () => lstat,
  lutimes: () => lutimes,
  mkdir: () => mkdir,
  mkdtemp: () => mkdtemp,
  open: () => open,
  opendir: () => opendir,
  readFile: () => readFile,
  readdir: () => readdir,
  readlink: () => readlink,
  realpath: () => realpath,
  rename: () => rename,
  rm: () => rm,
  rmdir: () => rmdir,
  stat: () => stat,
  statfs: () => statfs,
  symlink: () => symlink,
  truncate: () => truncate,
  unlink: () => unlink,
  utimes: () => utimes,
  watch: () => watch2,
  writeFile: () => writeFile
});
var promises_default;
var init_promises2 = __esm({
  "node_modules/unenv/dist/runtime/node/fs/promises.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_promises();
    init_constants();
    init_promises();
    promises_default = {
      constants: constants_exports,
      access,
      appendFile,
      chmod,
      chown,
      copyFile,
      cp,
      glob,
      lchmod,
      lchown,
      link,
      lstat,
      lutimes,
      mkdir,
      mkdtemp,
      open,
      opendir,
      readFile,
      readdir,
      readlink,
      realpath,
      rename,
      rm,
      rmdir,
      stat,
      statfs,
      symlink,
      truncate,
      unlink,
      utimes,
      watch: watch2,
      writeFile
    };
  }
});

// dist/_worker.js/pages/api/chat.astro.mjs
var chat_astro_exports = {};
__export(chat_astro_exports, {
  page: () => page4,
  renderers: () => renderers
});
function generateSEORecommendations(issues) {
  const recommendations = [];
  if (issues.some((issue) => issue.includes("title"))) {
    recommendations.push("Add compelling page title (30-60 characters)");
  }
  if (issues.some((issue) => issue.includes("meta description"))) {
    recommendations.push("Write compelling meta description (120-160 characters)");
  }
  if (issues.some((issue) => issue.includes("H1"))) {
    recommendations.push("Add single, keyword-rich H1 heading");
  }
  if (issues.some((issue) => issue.includes("alt text"))) {
    recommendations.push("Add descriptive alt text to all images");
  }
  return recommendations;
}
function calculateLeadScore(opportunities, seo, performance3, security) {
  let score = 0;
  score += opportunities.length * 20;
  opportunities.forEach((opp) => {
    if (opp.impact === "high") score += 15;
    if (opp.urgency === "high") score += 10;
  });
  if (seo.score < 50) score += 25;
  if (performance3.score < 60) score += 25;
  if (!security.isHTTPS) score += 30;
  return Math.min(100, score);
}
function determinePrimaryIssue(seo, performance3, security) {
  const scores = [
    { type: "seo", score: seo.score },
    { type: "performance", score: performance3.score },
    { type: "security", score: security.score }
  ];
  const lowest = scores.reduce(
    (min, current) => current.score < min.score ? current : min
  );
  return lowest.type;
}
function determineUrgencyLevel(opportunities) {
  const highUrgencyCount = opportunities.filter((opp) => opp.urgency === "high").length;
  if (highUrgencyCount >= 2) return "high";
  if (highUrgencyCount >= 1) return "medium";
  return "low";
}
function calculateAIReadinessScore(input) {
  const factors = {
    dataQuality: analyzeDataQuality(input),
    technicalInfrastructure: analyzeTechnicalReadiness(input),
    contentStructure: analyzeContentStructure(input),
    userExperience: analyzeUXForAutomation(input),
    businessProcesses: analyzeBusinessProcessMaturity(input)
  };
  const overall = Math.round(
    factors.dataQuality * 0.25 + factors.technicalInfrastructure * 0.2 + factors.contentStructure * 0.2 + factors.userExperience * 0.2 + factors.businessProcesses * 0.15
  );
  return {
    overall,
    breakdown: factors
  };
}
function analyzeDataQuality(input) {
  let score = 100;
  if (!input.html?.includes("application/ld+json")) score -= 20;
  if (!input.html?.includes("schema.org")) score -= 15;
  if (!input.html?.includes("gtag") && !input.html?.includes("analytics")) score -= 25;
  if (!input.seoData?.hasMetaDescription) score -= 10;
  if (!input.seoData?.hasTitle) score -= 10;
  return Math.max(0, score);
}
function analyzeTechnicalReadiness(input) {
  let score = 100;
  if (input.performanceData?.responseTime > 3e3) score -= 30;
  if (input.performanceData?.responseTime > 1500) score -= 15;
  if (!input.html?.includes("api") && !input.html?.includes("json")) score -= 20;
  if (!input.html?.includes("viewport")) score -= 15;
  return Math.max(0, score);
}
function analyzeContentStructure(input) {
  let score = 100;
  const html = input.html || "";
  if (!html.includes("<header>")) score -= 10;
  if (!html.includes("<main>")) score -= 10;
  if (!html.includes("<nav>")) score -= 10;
  const h1Count = (html.match(/<h1/g) || []).length;
  const h2Count = (html.match(/<h2/g) || []).length;
  if (h1Count !== 1) score -= 15;
  if (h2Count < 2) score -= 10;
  const formCount = (html.match(/<form/g) || []).length;
  if (formCount === 0) score -= 20;
  return Math.max(0, score);
}
function analyzeUXForAutomation(input) {
  let score = 100;
  const html = input.html || "";
  if (!html.includes("button")) score -= 15;
  if (!html.includes("input")) score -= 20;
  if (!html.includes("chat") && !html.includes("contact")) score -= 25;
  if (!html.includes("newsletter") && !html.includes("subscribe")) score -= 10;
  if (!html.includes("search")) score -= 10;
  return Math.max(0, score);
}
function analyzeBusinessProcessMaturity(input) {
  let score = 100;
  const html = input.html || "";
  if (!html.includes("hubspot") && !html.includes("salesforce") && !html.includes("mailchimp")) score -= 20;
  if (html.includes("shop") || html.includes("cart") || html.includes("buy")) score += 15;
  if (!html.includes("form") && !html.includes("contact")) score -= 25;
  return Math.min(100, Math.max(0, score));
}
function identifyAutomationOpportunities(input) {
  const opportunities = [];
  const html = input.html || "";
  if (html.includes("form") || html.includes("contact")) {
    opportunities.push({
      category: "Lead Generation",
      opportunity: "AI Lead Qualification Agent",
      description: "Automate lead scoring, qualification, and initial outreach based on visitor behavior and form submissions",
      impact: "high",
      timeToValue: "2-4 weeks",
      estimatedROI: "300-500%"
    });
  }
  if (html.includes("support") || html.includes("help") || html.includes("faq")) {
    opportunities.push({
      category: "Customer Support",
      opportunity: "AI Support Agent",
      description: "Deploy 24/7 AI customer support that handles 80% of inquiries automatically",
      impact: "high",
      timeToValue: "1-3 weeks",
      estimatedROI: "200-400%"
    });
  }
  if (html.includes("blog") || html.includes("news") || html.includes("article")) {
    opportunities.push({
      category: "Content Marketing",
      opportunity: "AI Content Generator Agent",
      description: "Automatically create, optimize, and publish content based on trending topics and SEO opportunities",
      impact: "medium",
      timeToValue: "3-6 weeks",
      estimatedROI: "150-300%"
    });
  }
  if (html.includes("shop") || html.includes("product") || html.includes("cart")) {
    opportunities.push({
      category: "E-commerce",
      opportunity: "AI Sales Assistant Agent",
      description: "Personalized product recommendations, abandoned cart recovery, and dynamic pricing optimization",
      impact: "high",
      timeToValue: "4-8 weeks",
      estimatedROI: "250-450%"
    });
  }
  opportunities.push({
    category: "SEO Optimization",
    opportunity: "AI SEO Monitor Agent",
    description: "Continuously monitor rankings, identify content gaps, and automatically optimize meta tags and content",
    impact: "medium",
    timeToValue: "2-6 weeks",
    estimatedROI: "180-350%"
  });
  return opportunities;
}
function generateAIAgentRecommendations(readinessScore, opportunities) {
  const recommendations = [];
  if (readinessScore.overall >= 80) {
    recommendations.push({
      priority: "immediate",
      agent: "Full AI Business Intelligence Suite",
      description: "Your website is highly ready for AI automation. Deploy comprehensive AI agents across all business functions.",
      investment: "$5,000-15,000/month",
      expectedOutcome: "Complete business process automation with 40-70% operational efficiency gains"
    });
  } else if (readinessScore.overall >= 60) {
    recommendations.push({
      priority: "high",
      agent: "Targeted AI Agent Deployment",
      description: "Focus on 2-3 high-impact AI agents to maximize immediate ROI while building foundation for expansion.",
      investment: "$2,000-8,000/month",
      expectedOutcome: "25-50% improvement in targeted business areas"
    });
  } else if (readinessScore.overall >= 40) {
    recommendations.push({
      priority: "medium",
      agent: "AI Readiness Foundation",
      description: "Implement basic AI infrastructure and one pilot AI agent to demonstrate value and build capabilities.",
      investment: "$1,000-4,000/month",
      expectedOutcome: "15-30% efficiency gain in pilot area plus foundation for future AI expansion"
    });
  } else {
    recommendations.push({
      priority: "preparation",
      agent: "AI Foundation Building",
      description: "Focus on improving technical infrastructure and data quality before deploying AI agents.",
      investment: "$500-2,000/month",
      expectedOutcome: "AI-ready infrastructure within 3-6 months, then deploy targeted agents"
    });
  }
  return recommendations;
}
function calculateBusinessImpact(opportunities) {
  const highImpactCount = opportunities.filter((opp) => opp.impact === "high").length;
  const totalOpportunities = opportunities.length;
  return {
    potentialRevenueLift: `${Math.round(highImpactCount / totalOpportunities * 100 + 20)}%-${Math.round(highImpactCount / totalOpportunities * 150 + 50)}%`,
    operationalSavings: `${Math.round(totalOpportunities * 15)}%-${Math.round(totalOpportunities * 35)}%`,
    timeToPositiveROI: totalOpportunities > 3 ? "2-4 months" : "1-3 months",
    riskLevel: totalOpportunities > 4 ? "low" : "very-low"
  };
}
function generateNextSteps(overallScore) {
  const steps = [
    "Schedule AI readiness consultation with MK team",
    "Prioritize automation opportunities based on business impact",
    "Develop custom AI agent implementation roadmap"
  ];
  if (overallScore < 60) {
    steps.unshift("Improve technical infrastructure and data quality");
  }
  if (overallScore >= 80) {
    steps.push("Begin full AI transformation program");
  } else {
    steps.push("Start with pilot AI agent deployment");
  }
  return steps;
}
function getReadinessLevel(score) {
  if (score >= 80) return "Highly Ready";
  if (score >= 60) return "Ready";
  if (score >= 40) return "Moderately Ready";
  return "Needs Foundation Work";
}
function createAdvancedWebAnalysisService() {
  const service = new Service("advanced_web_analysis", {
    enabled: true,
    requiresVerification: true,
    maxExecutionTime: 3e4
  });
  service.addComponent("fetch_website", fetchWebsiteComponent);
  service.addComponent("seo_analysis", seoAnalysisComponent);
  service.addComponent("performance_analysis", performanceComponent);
  service.addComponent("security_analysis", securityComponent);
  service.addComponent("opportunity_detection", opportunityDetectionComponent);
  service.addComponent("ai_readiness_analysis", aiReadinessComponent);
  return service;
}
function createCompetitiveIntelligenceService() {
  const service = new Service("competitive_intelligence", {
    enabled: false,
    // Will enable when components are ready
    requiresVerification: true,
    maxExecutionTime: 45e3
  });
  return service;
}
function createDigitalMarketingAuditService() {
  const service = new Service("digital_marketing_audit", {
    enabled: false,
    requiresVerification: true,
    maxExecutionTime: 4e4
  });
  return service;
}
function createBusinessGrowthOptimizerService() {
  const service = new Service("business_growth_optimizer", {
    enabled: false,
    requiresVerification: true,
    requiresPhoneVerification: true,
    // This will require phone verification
    maxExecutionTime: 6e4
  });
  return service;
}
function createAIServicesRegistry() {
  const registry = new ServiceRegistry();
  const emailVerificationService = new Service("ai_email_verification", {
    enabled: true,
    requiresVerification: false,
    maxExecutionTime: 1e4
  });
  emailVerificationService.addComponent("email_verification_ai", emailVerificationAIComponent);
  const sessionManagementService = new Service("ai_session_management", {
    enabled: true,
    requiresVerification: false,
    maxExecutionTime: 5e3
  });
  sessionManagementService.addComponent("session_management_ai", sessionManagementAIComponent);
  const phoneVerificationService = new Service("ai_phone_verification", {
    enabled: false,
    requiresVerification: false,
    maxExecutionTime: 15e3
  });
  phoneVerificationService.addComponent("phone_verification_ai", phoneVerificationAIComponent);
  registry.register(emailVerificationService);
  registry.register(sessionManagementService);
  registry.register(phoneVerificationService);
  return registry;
}
function createUserServicesRegistry() {
  const registry = new ServiceRegistry();
  registry.register(createAdvancedWebAnalysisService());
  registry.register(createCompetitiveIntelligenceService());
  registry.register(createDigitalMarketingAuditService());
  registry.register(createBusinessGrowthOptimizerService());
  return registry;
}
function devLog(message, data) {
}
function errorLog(message, error4) {
  if (error4) {
    console.error(message, error4);
  } else {
    console.error(message);
  }
}
function createServiceArchitecture(environment) {
  return new ServiceArchitecture(environment);
}
function createPromptBuilder(persona = "business_consultant", goals = "business_consultation", environment) {
  if (!environment) {
    {
      environment = "production";
    }
  }
  return new PromptBuilder({
    persona,
    goals,
    environment
  });
}
async function readDevVarsFromFile() {
  try {
    const isNode2 = typeof process !== "undefined" && !!process.versions?.node;
    if (!isNode2) return void 0;
    const { readFile: readFile2 } = await Promise.resolve().then(() => (init_promises2(), promises_exports));
    const path = `${process.cwd()}/.dev.vars`;
    const raw = await readFile2(path, "utf8");
    const env2 = {};
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx < 0) continue;
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if (val.startsWith('"') && val.endsWith('"') || val.startsWith("'") && val.endsWith("'")) {
        val = val.slice(1, -1);
      }
      env2[key] = val;
    }
    return env2;
  } catch {
    return void 0;
  }
}
function getAvailableToolsFromServices(serviceArchitecture, profile3) {
  const accessibleServices = serviceArchitecture.getAccessibleServices(profile3);
  const serviceTools = accessibleServices.filter((service) => service.functionName && service.canDemoInChat).map((service) => {
    const convertToOpenAISchema = /* @__PURE__ */ __name((googleSheetsParams) => {
      let parsedParams = googleSheetsParams;
      if (typeof googleSheetsParams === "string") {
        try {
          parsedParams = JSON.parse(googleSheetsParams);
        } catch (e) {
          console.warn("Failed to parse parameters:", googleSheetsParams);
          return { properties: {}, required: [] };
        }
      }
      if (!parsedParams || typeof parsedParams !== "object") {
        return { properties: {}, required: [] };
      }
      const properties = {};
      const required = [];
      Object.entries(parsedParams).forEach(([key, type]) => {
        if (typeof type === "string") {
          switch (type) {
            case "string":
              properties[key] = { type: "string", description: `${key} parameter` };
              break;
            case "number":
              properties[key] = { type: "number", description: `${key} parameter` };
              break;
            case "boolean":
              properties[key] = { type: "boolean", description: `${key} parameter` };
              break;
            case "array":
              properties[key] = { type: "array", items: { type: "string" }, description: `${key} parameter` };
              break;
            case "json":
              properties[key] = { type: "object", description: `${key} parameter` };
              break;
            default:
              properties[key] = { type: "string", description: `${key} parameter` };
          }
          required.push(key);
        }
      });
      return { properties, required };
    }, "convertToOpenAISchema");
    const schemaData = convertToOpenAISchema(service.parameters);
    return {
      type: "function",
      function: {
        name: service.functionName,
        description: service.description,
        parameters: {
          type: "object",
          properties: schemaData.properties,
          required: schemaData.required
        }
      }
    };
  });
  const calendarTool = {
    type: "function",
    function: {
      name: "schedule_discovery_call",
      description: "Schedule a discovery call when user shows interest in services, asks about pricing, or wants to discuss their specific business needs. Use to capture leads and move conversations forward.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Contact's full name" },
          email: { type: "string", description: "Contact's email address" },
          phone: { type: "string", description: "Contact's phone number (optional)" },
          preferred_times: { type: "string", description: "Preferred meeting times or availability (e.g., 'Tomorrow 2 PM' or 'flexible')" },
          timezone: { type: "string", description: "Contact's timezone (default: America/Los_Angeles)" },
          project_details: { type: "string", description: "Brief description of their project, business challenge, or goals" }
        },
        required: ["name", "email", "phone"]
      }
    }
  };
  const meetingLookupTool = {
    type: "function",
    function: {
      name: "lookup_existing_meetings",
      description: "Look up existing meetings for a user by their email address. Use when user asks about their scheduled calls, meetings, or appointments.",
      parameters: {
        type: "object",
        properties: {
          email: { type: "string", description: "User's email address to search for existing meetings" }
        },
        required: ["email"]
      }
    }
  };
  const meetingManagementTool = {
    type: "function",
    function: {
      name: "manage_meeting",
      description: "Cancel or request changes to an existing meeting. Use when user wants to cancel, reschedule, or modify their appointment. Users can provide either their email address or meeting tracking ID.",
      parameters: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["cancel", "reschedule"], description: "Action to perform on the meeting" },
          email: { type: "string", description: "User's email address associated with the meeting (preferred method)" },
          tracking_id: { type: "string", description: "Meeting reference/tracking ID (alternative to email)" },
          new_preferred_times: { type: "string", description: "New preferred times (only for reschedule action)" },
          reason: { type: "string", description: "Reason for cancellation or change (optional)" }
        },
        required: ["action"]
      }
    }
  };
  return [...serviceTools, calendarTool, meetingLookupTool, meetingManagementTool];
}
function getEnvVal(key, environment) {
  const envFromRuntime = environment && typeof environment === "object" ? environment[key] : void 0;
  let envFromImportMeta;
  try {
    envFromImportMeta = __vite_import_meta_env__2;
  } catch {
    envFromImportMeta = void 0;
  }
  const envFromProcess = typeof process !== "undefined" && process.env ? process.env[key] : void 0;
  const metaVal = envFromImportMeta && typeof envFromImportMeta === "object" ? envFromImportMeta[key] : void 0;
  return envFromRuntime ?? metaVal ?? envFromProcess;
}
function extractBookingDetails(messages) {
  const userMessages = messages.filter((m) => m.role === "user");
  const recentUsers = userMessages.slice(-4);
  const joinedUser = recentUsers.map((m) => m.content).join("\n");
  const lastUser = userMessages[userMessages.length - 1];
  const lastUserText = lastUser?.content || "";
  const lowerLast = lastUserText.toLowerCase();
  const isGreetingOnly = /^(hi|hey|hello|yo|sup|howdy)[.!\s]*$/i.test(lastUserText.trim());
  const explicitBooking = /\b(please\s+book|book\s+(?:a|the)?\s*call|schedule\s+(?:a|the)?\s*call|go\s+ahead\s+and\s+book|let'?s\s+(?:book|schedule)|set\s*up\s*(?:a|the)?\s*call)\b/i.test(lastUserText);
  const emailMatch = joinedUser.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  let email = emailMatch ? emailMatch[0] : void 0;
  const phoneMatch = joinedUser.match(/\b(?:\+?\d{1,3}[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}\b/);
  const phone = phoneMatch ? phoneMatch[0] : void 0;
  const namePatterns = [
    /\bmy\s+name\s+is\s+([A-Za-z][A-Za-z'\-]+(?:\s+[A-Za-z][A-Za-z'\-]+){0,2})/i,
    /\bi\s*am\s+([A-Za-z][A-Za-z'\-]+(?:\s+[A-Za-z][A-Za-z'\-]+){0,2})/i,
    /\bi'?m\s+([A-Za-z][A-Za-z'\-]+(?:\s+[A-Za-z][A-Za-z'\-]+){0,2})/i,
    /\bthis\s+is\s+([A-Za-z][A-Za-z'\-]+(?:\s+[A-Za-z][A-Za-z'\-]+){0,2})/i
  ];
  let name;
  for (const re of namePatterns) {
    const m = joinedUser.match(re);
    if (m?.[1]) {
      name = m[1].trim();
      break;
    }
  }
  const dayRe = /(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|thur|fri|sat|sun|today|tomorrow|next\s+(?:week|monday|tuesday|wednesday|thursday|friday|saturday|sunday))/i;
  const timeRe = /\b\d{1,2}(:\d{2})?\s?(am|pm)\b/i;
  const flexRe = /\b(flexible|any\s*time|whenever|you\s*pick|open)\b/i;
  let preferred_times;
  if (flexRe.test(lowerLast)) {
    preferred_times = "flexible";
  } else {
    const idx = lastUserText.search(new RegExp(`${dayRe.source}|${timeRe.source}`, "i"));
    if (idx !== -1) {
      const start = Math.max(0, idx - 120);
      const end = Math.min(lastUserText.length, idx + 240);
      const window = lastUserText.substring(start, end).replace(/\n+/g, " ").trim();
      preferred_times = window.length > 400 ? window.slice(0, 397) + "..." : window;
    }
  }
  const tzMatch = lastUserText.match(/\b(ACDT|ACST|ACT|ADT|AEDT|AEST|AKDT|AKST|AST|AWST|BST|CDT|CEST|CET|CST|EAT|EDT|EEST|EET|EST|GMT|HKT|HST|IST|JST|KST|MDT|MSK|MST|NZDT|NZST|PDT|PET|PKT|PHT|PST|SGT|UTC|WAT|WET)\b/i);
  const timezone = tzMatch ? tzMatch[0].toUpperCase() : void 0;
  let project_details = lastUserText.trim();
  if (project_details && project_details.length > 500) project_details = project_details.slice(0, 500) + "...";
  const ready = Boolean(!isGreetingOnly && explicitBooking && email && project_details && project_details.length >= 8);
  return { ready, explicitBooking, name, email, phone, preferred_times, timezone, project_details };
}
async function executeWebsiteAnalysis(url, sessionId, kv, profile3, profileManager, serviceArchitecture) {
  try {
    const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;
    const accessCheck = serviceArchitecture.checkAccess("analyze_website", profile3);
    if (!accessCheck.allowed) {
      await profileManager.trackServiceUsage(profile3, "analyze_website", "premium", false);
      return {
        status: "access_denied",
        message: accessCheck.message,
        suggested_action: accessCheck.suggestedAction,
        url: normalizedUrl
      };
    }
    const result = await serviceOrchestrator.executeUserService(
      "advanced_web_analysis",
      { url: normalizedUrl },
      { session_id: sessionId, kv }
    );
    await profileManager.trackServiceUsage(profile3, "analyze_website", "premium", true);
    return result;
  } catch (error4) {
    return {
      status: "error",
      message: error4 instanceof Error ? error4.message : "Analysis failed"
    };
  }
}
async function executeShowServices(profile3, profileManager, serviceArchitecture) {
  const allServices = serviceArchitecture.getUserFacingServices();
  if (allServices.length === 0) {
    return {
      available_services: [],
      total_services: 0,
      categories: []
    };
  }
  await profileManager.trackServiceUsage(profile3, "show_available_services", "free", true);
  const categories = Array.from(new Set(allServices.map((s) => s.businessCategory))).filter((cat) => typeof cat === "string" && cat.trim() !== "");
  return {
    available_services: allServices.map((s) => ({
      name: s.displayName,
      description: s.description,
      category: s.businessCategory,
      type: s.serviceType,
      delivery: s.deliveryMethod,
      status: "available"
    })),
    total_services: allServices.length,
    categories,
    service_catalog: "MannyKnows"
  };
}
async function executeGetSeoTips(topic, profile3, profileManager) {
  await profileManager.trackServiceUsage(profile3, "get_seo_tips", "free", true);
  const tips = {
    "general": [
      "Focus on high-quality, relevant content",
      "Optimize your page titles and meta descriptions",
      "Improve your website loading speed",
      "Use schema markup for better search visibility",
      "Build quality backlinks from relevant websites"
    ],
    "content": [
      "Write for your audience, not just search engines",
      "Use header tags (H1, H2, H3) to structure content",
      "Include relevant keywords naturally in your content",
      "Create comprehensive, in-depth content",
      "Update old content regularly"
    ],
    "technical": [
      "Ensure your website is mobile-friendly",
      "Create an XML sitemap",
      "Fix broken links and 404 errors",
      "Optimize images with alt text",
      "Improve Core Web Vitals scores"
    ]
  };
  const relevantTips = tips[topic] || tips["general"];
  return {
    topic,
    tips: relevantTips,
    tip_count: relevantTips.length,
    category: topic
  };
}
async function executeCheckDomain(domain2, profile3, profileManager) {
  await profileManager.trackServiceUsage(profile3, "check_domain_status", "free", true);
  const cleanDomain = domain2.replace(/^https?:\/\//, "").replace(/^www\./, "");
  return {
    domain: cleanDomain,
    status: "available",
    // Simulated
    extensions: [".com", ".net", ".org"],
    message: `Domain check completed for ${cleanDomain}`
  };
}
async function executeIndustryInsights(industry, profile3, profileManager, serviceArchitecture) {
  const accessCheck = serviceArchitecture.checkAccess("get_industry_insights", profile3);
  if (!accessCheck.allowed) {
    return {
      status: "access_denied",
      message: accessCheck.message
    };
  }
  await profileManager.trackServiceUsage(profile3, "get_industry_insights", "free", true);
  const insights = {
    industry,
    averageConversionRate: "2.5%",
    topTrafficSources: ["Search", "Social Media", "Direct"],
    keyMetrics: {
      pageSpeed: "3.2s average",
      mobileOptimization: "78% of sites",
      sslAdoption: "95%"
    },
    message: `Industry insights for ${industry} sector`
  };
  return insights;
}
async function executeScheduleCall(functionArgs, profile3, profileManager, environment, kv) {
  const { name, email, phone, preferred_times, timezone, project_details } = functionArgs;
  if (!name || !email) {
    return {
      status: "validation_error",
      error: "Name and email are required for scheduling",
      required_fields: ["name", "email"]
    };
  }
  if (kv && typeof kv.list === "function") {
    try {
      const existingMeetings = [];
      const allMeetings = await kv.list({ prefix: "meetreq:" });
      for (const key of allMeetings.keys) {
        try {
          const meetingData = await kv.get(key.name);
          if (meetingData) {
            const meeting = JSON.parse(meetingData);
            if (meeting.email && meeting.email.toLowerCase() === email.toLowerCase() && meeting.status === "pending") {
              existingMeetings.push(meeting);
            }
          }
        } catch (e) {
          continue;
        }
      }
      if (existingMeetings.length > 0) {
        const latestMeeting = existingMeetings[0];
        return {
          status: "duplicate_meeting",
          error: "You already have a pending discovery call request",
          existing_meeting: {
            id: latestMeeting.id,
            proposed_time: latestMeeting.proposed_time,
            meeting_link: latestMeeting.meeting_link
          },
          message: `You already have a discovery call scheduled for ${latestMeeting.proposed_time}. If you need to make changes, please let me know and I can help you reschedule or cancel it.`
        };
      }
    } catch (e) {
    }
  }
  await profileManager.trackServiceUsage(profile3, "schedule_discovery_call", "free", true);
  try {
    let pickProposedTime = /* @__PURE__ */ __name(function(text, tz) {
      if (!text) return "Flexible (we will confirm by email)";
      const lower = text.toLowerCase();
      const now = /* @__PURE__ */ new Date();
      let day = new Date(now);
      if (/tomorrow/.test(lower)) {
        day = new Date(now.getTime() + 24 * 60 * 60 * 1e3);
      }
      const m = text.match(/\b(\d{1,2})(?::(\d{2}))?\s?(am|pm)\b/i);
      let hours = 14, minutes = 0, ampm = "pm";
      if (m) {
        hours = parseInt(m[1], 10);
        minutes = m[2] ? parseInt(m[2], 10) : 0;
        ampm = (m[3] || "").toLowerCase();
      }
      if (ampm === "pm" && hours < 12) hours += 12;
      if (ampm === "am" && hours === 12) hours = 0;
      minutes = Math.floor(minutes / 15) * 15;
      const scheduled = new Date(day);
      scheduled.setHours(hours, minutes, 0, 0);
      const tzLabel = tz || ownerTimezone;
      return `${scheduled.toDateString()} ${("0" + (hours % 12 || 12)).slice(-2)}:${("0" + minutes).slice(-2)} ${ampm.toUpperCase()} (${tzLabel})`;
    }, "pickProposedTime");
    const ownerEmail = getEnvVal("OWNER_EMAIL", environment) || "manny@mannyknows.com";
    const ownerTimezone = getEnvVal("OWNER_TIMEZONE", environment) || "America/New_York";
    const trackingId = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const proposedTime = pickProposedTime(preferred_times, timezone);
    const jitsiAuto = (getEnvVal("JITSI_AUTO_LINK", environment) ?? "true").toString().toLowerCase() !== "false";
    const jitsiBase = (getEnvVal("JITSI_BASE_URL", environment) || "https://meet.jit.si").replace(/\/$/, "");
    const roomName = `mk-${trackingId}`;
    const meetingLink = jitsiAuto ? `${jitsiBase}/${encodeURIComponent(roomName)}` : void 0;
    if (kv && typeof kv.put === "function") {
      const record = {
        id: trackingId,
        type: "discovery_call_request",
        createdAt: Date.now(),
        name,
        email,
        phone,
        preferred_times: preferred_times || "flexible",
        timezone: timezone || ownerTimezone,
        project_details: project_details || "",
        proposed_time: proposedTime,
        meeting_link: meetingLink,
        status: "pending"
      };
      try {
        await kv.put(`meetreq:${trackingId}`, JSON.stringify(record), { expirationTtl: 60 * 60 * 24 * 14 });
      } catch (e) {
        devLog("KV put failed for meeting request", e);
      }
    }
    try {
      const resendKey = getEnvVal("RESEND_API_KEY", environment);
      const resendFrom = getEnvVal("RESEND_FROM", environment) || "MannyKnows <onboarding@resend.dev>";
      if (resendKey) {
        const subject = `New Discovery Call Request \u2014 ${name}${proposedTime ? ` (${proposedTime})` : ""}`;
        const textBody = `New discovery call request

Name: ${name}
Email: ${email}
Phone: ${phone || "N/A"}
Preferred: ${preferred_times || "flexible"}
Timezone: ${timezone || ownerTimezone}
Proposed time: ${proposedTime}${meetingLink ? `
Meeting link: ${meetingLink}` : ""}
Details: ${project_details || ""}
Tracking: ${trackingId}`;
        const htmlBody = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Discovery Call Request</title>
  <style>
    body{margin:0;padding:0;background:#fafafa;color:#18181b;font-family:-apple-system,BlinkMacSystemFont,"Inter",sans-serif;line-height:1.6}
    .outer{background:linear-gradient(to-t,rgba(244,244,245,0.5) 0%,rgba(250,250,250,0.3) 50%,rgba(244,244,245,0.2) 100%);min-height:100vh;padding:40px 20px}
    .container{max-width:680px;margin:0 auto}
    .card{background:#ffffff;border:1px solid #e4e4e7;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05),0 2px 4px -1px rgba(0,0,0,0.03)}
    .header{padding:32px 40px;background:linear-gradient(135deg,#10d1ff 0%,#ff4faa 100%);position:relative}
    .brand{font-weight:700;font-size:28px;color:#ffffff;letter-spacing:-0.025em}
    .subtitle{color:rgba(255,255,255,0.95);font-size:16px;margin-top:6px;font-weight:500}
    .content{padding:40px 40px 32px;background:#ffffff}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:32px}
    .field{background:#fafafa;border:1px solid #f4f4f5;border-radius:12px;padding:20px;transition:all 0.3s ease}
    .field:hover{background:#f4f4f5;border-color:#e4e4e7}
    .label{display:block;color:#71717a;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;font-weight:600}
    .value{font-size:16px;color:#18181b;line-height:1.5;word-break:break-word;font-weight:500}
    .full-width{grid-column:1/-1}
    .details-field{background:#fafafa;border:1px solid #f4f4f5;border-radius:12px;padding:24px;margin-bottom:24px}
    .btn-container{text-align:center;margin:32px 0}
    .btn{display:inline-block;background:linear-gradient(135deg,#10d1ff,#ff4faa);color:#ffffff;text-decoration:none;padding:16px 32px;border-radius:12px;font-weight:600;font-size:16px;box-shadow:0 4px 14px rgba(16,209,255,0.25);transition:all 0.3s ease;letter-spacing:-0.025em}
    .btn:hover{transform:translateY(-1px);box-shadow:0 8px 25px rgba(16,209,255,0.3)}
    .meta{background:#f4f4f5;border:1px solid #e4e4e7;border-radius:12px;padding:16px;text-align:center;margin-top:24px}
    .tracking{color:#71717a;font-size:13px;font-family:"SF Mono",Monaco,monospace;font-weight:500}
    .footer{text-align:center;margin-top:32px;padding:24px;color:#71717a;font-size:13px;background:#f4f4f5;border-radius:12px;border:1px solid #e4e4e7;font-weight:500}
    .highlight{background:linear-gradient(135deg,#10d1ff,#ff4faa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;font-weight:700}
    @media (max-width:640px){
      .outer{padding:20px 16px}
      .content{padding:24px 24px 20px}
      .grid{grid-template-columns:1fr;gap:16px}
      .brand{font-size:24px}
      .btn{padding:14px 24px;font-size:15px}
      .header{padding:24px 24px}
    }
  </style>
  <!--[if mso]><style>.btn{font-family:Arial, sans-serif !important;background:#10d1ff !important}</style><![endif]-->
</head>
<body>
  <div class="outer">
    <div class="container">
      <div class="card">
        <div class="header">
          <div class="brand">MK</div>
          <div class="subtitle">Discovery Call Request</div>
        </div>
        <div class="content">
          <div class="grid">
            <div class="field">
              <span class="label">Name</span>
              <div class="value">${name}</div>
            </div>
            <div class="field">
              <span class="label">Email</span>
              <div class="value">${email}</div>
            </div>
            <div class="field">
              <span class="label">Phone</span>
              <div class="value">${phone || "Not provided"}</div>
            </div>
            <div class="field">
              <span class="label">Timezone</span>
              <div class="value">${timezone || ownerTimezone}</div>
            </div>
            <div class="field full-width">
              <span class="label">Preferred Time</span>
              <div class="value">${(preferred_times || "Flexible").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
            </div>
            <div class="field full-width">
              <span class="label">Proposed Meeting Time</span>
              <div class="value">${proposedTime}</div>
            </div>
          </div>
          
          ${project_details ? `<div class="details-field full-width">
            <span class="label">Project Details</span>
            <div class="value">${project_details.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
          </div>` : ""}
          
          ${meetingLink ? `<div class="btn-container">
            <a class="btn" href="${meetingLink}" target="_blank" rel="noopener noreferrer">Join Meeting \u2192</a>
          </div>` : ""}
          
          <div class="meta">
            <div class="tracking">Reference: ${trackingId}</div>
          </div>
        </div>
        <div class="footer">
          This notification was sent by the <span class="highlight">MannyKnows</span> AI assistant<br>
          Automated lead capture \xB7 Intelligent business operations
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
        const emailResp = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            from: resendFrom,
            to: [ownerEmail],
            subject,
            text: textBody,
            html: htmlBody
          })
        });
        try {
          const emailText = await emailResp.text();
          devLog("Resend email response:", { status: emailResp.status, body: emailText });
        } catch {
        }
      }
    } catch (e) {
      devLog("Resend email failed for meeting request", e);
    }
    return {
      status: "meeting_requested",
      tracking_id: trackingId,
      contact: { name, email },
      proposed_time: proposedTime,
      meeting_link: meetingLink
    };
  } catch (error4) {
    errorLog("Meeting request error:", error4);
    return {
      status: "error",
      fallback_email: getEnvVal("OWNER_EMAIL", environment) || "manny@mannyknows.com"
    };
  }
}
async function executeLookupExistingMeetings(functionArgs, profile3, profileManager, environment, kv) {
  const { email } = functionArgs;
  if (!email) {
    return {
      status: "validation_error",
      error: "Email address is required for lookup",
      required_fields: ["email"]
    };
  }
  if (!kv || typeof kv.list !== "function") {
    return {
      status: "error",
      error: "Meeting storage not available"
    };
  }
  try {
    const meetings = [];
    const allMeetings = await kv.list({ prefix: "meetreq:" });
    for (const key of allMeetings.keys) {
      try {
        const meetingData = await kv.get(key.name);
        if (meetingData) {
          const meeting = JSON.parse(meetingData);
          if (meeting.email && meeting.email.toLowerCase() === email.toLowerCase()) {
            const meetingInfo = {
              id: meeting.id,
              name: meeting.name,
              email: meeting.email,
              proposed_time: meeting.proposed_time,
              status: meeting.status,
              meeting_link: meeting.meeting_link,
              created_at: meeting.createdAt,
              project_details: meeting.project_details
            };
            if (meeting.status === "reschedule_requested") {
              meetingInfo.reschedule_info = {
                new_preferred_times: meeting.new_preferred_times || meeting.newPreferredTimes,
                reschedule_reason: meeting.reschedule_reason || meeting.rescheduleReason,
                requested_at: meeting.reschedule_requested_at || meeting.rescheduleRequestedAt
              };
              meetingInfo.display_message = `PENDING RESCHEDULE: Originally ${meeting.proposed_time}, requested to reschedule to ${meeting.new_preferred_times || meeting.newPreferredTimes}`;
            }
            if (meeting.status === "cancelled") {
              meetingInfo.cancellation_info = {
                reason: meeting.cancellation_reason || meeting.cancellationReason,
                cancelled_at: meeting.cancelled_at || meeting.cancelledAt
              };
              meetingInfo.display_message = `CANCELLED: Was scheduled for ${meeting.proposed_time}`;
            }
            meetings.push(meetingInfo);
          }
        }
      } catch (e) {
        continue;
      }
    }
    meetings.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
    await profileManager.trackServiceUsage(profile3, "lookup_existing_meetings", "free", true);
    return {
      status: "success",
      email,
      meetings,
      total_count: meetings.length
    };
  } catch (error4) {
    errorLog("Meeting lookup error:", error4);
    return {
      status: "error",
      error: "Failed to look up meetings"
    };
  }
}
async function executeManageMeeting(functionArgs, profile3, profileManager, environment, kv) {
  const { action, email, tracking_id, new_preferred_times, reason } = functionArgs;
  if (!action || !email && !tracking_id) {
    return {
      status: "validation_error",
      error: "Action and either email or tracking ID are required",
      required_fields: ["action", "email (or tracking_id)"]
    };
  }
  if (!kv || typeof kv.get !== "function") {
    return {
      status: "error",
      error: "Meeting storage not available"
    };
  }
  try {
    let meeting = null;
    let meetingKey = null;
    if (email) {
      const meetings = await kv.list({ prefix: "meetreq:" });
      for (const key of meetings.keys) {
        const meetingData = await kv.get(key.name);
        if (meetingData) {
          const parsedMeeting = JSON.parse(meetingData);
          if (parsedMeeting.email && parsedMeeting.email.toLowerCase() === email.toLowerCase()) {
            if (!meeting || parsedMeeting.status !== "cancelled" && parsedMeeting.created_at > meeting.created_at) {
              meeting = parsedMeeting;
              meetingKey = key.name;
            }
          }
        }
      }
      if (!meeting) {
        return {
          status: "not_found",
          error: `No active meeting found for email ${email}. Please check your email address or contact support.`
        };
      }
    } else {
      const meetingData = await kv.get(`meetreq:${tracking_id}`);
      if (!meetingData) {
        return {
          status: "not_found",
          error: `Meeting with ID ${tracking_id} not found`
        };
      }
      meeting = JSON.parse(meetingData);
      meetingKey = `meetreq:${tracking_id}`;
    }
    if (meeting.status === "cancelled") {
      return {
        status: "already_cancelled",
        error: "This meeting has already been cancelled"
      };
    }
    const resendKey = getEnvVal("RESEND_API_KEY", environment);
    const resendFrom = getEnvVal("RESEND_FROM", environment) || "MannyKnows <noreply@mannyknows.com>";
    if (!resendKey) {
      return {
        status: "error",
        error: "Email verification system not available"
      };
    }
    const verificationToken = crypto.randomUUID();
    const verificationExpiry = Date.now() + 24 * 60 * 60 * 1e3;
    const pendingAction = {
      action,
      trackingId: meeting.id,
      // Use the actual meeting ID
      meetingKey,
      // Store the KV key for later lookup
      reason,
      newPreferredTimes: new_preferred_times,
      requestedAt: Date.now(),
      expiresAt: verificationExpiry,
      email: meeting.email,
      name: meeting.name
    };
    await kv.put(`verify:${verificationToken}`, JSON.stringify(pendingAction), {
      expirationTtl: 86400
      // 24 hours in seconds
    });
    const verificationUrl = `https://mannyknows.com/api/verify-meeting-action?token=${verificationToken}&action=${action}`;
    const actionText = action === "cancel" ? "cancellation" : "reschedule request";
    const actionEmoji = action === "cancel" ? "\u274C" : "\u{1F504}";
    const htmlBody = generateVerificationEmail(meeting, action, verificationUrl, reason, new_preferred_times);
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: resendFrom,
        to: [meeting.email],
        subject: `${actionEmoji} Verify your meeting ${actionText} - MannyKnows`,
        html: htmlBody
      })
    });
    if (!emailResponse.ok) {
      throw new Error("Failed to send verification email");
    }
    await profileManager.trackServiceUsage(profile3, "manage_meeting_verification", "free", true);
    return {
      status: "verification_sent",
      tracking_id: meeting.id,
      action,
      message: `A verification email has been sent to ${meeting.email}. Please check your email and click the verification link to confirm your ${actionText}.`,
      verification_required: true,
      email_sent_to: meeting.email,
      meeting_details: {
        name: meeting.name,
        proposed_time: meeting.proposed_time,
        meeting_link: meeting.meeting_link || "TBD"
      }
    };
  } catch (error4) {
    errorLog("Meeting management error:", error4);
    return {
      status: "error",
      error: "Failed to process meeting management request"
    };
  }
}
function generateVerificationEmail(meeting, action, verificationUrl, reason, newPreferredTimes) {
  const actionText = action === "cancel" ? "cancellation" : "reschedule request";
  const actionTitle = action === "cancel" ? "Cancel Meeting" : "Reschedule Meeting";
  const actionColor = action === "cancel" ? "#ef4444" : "#f59e0b";
  const actionEmoji = action === "cancel" ? "\u274C" : "\u{1F504}";
  return `
    <!doctype html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Verify Meeting ${actionTitle} - MannyKnows</title>
      <style>
        body{margin:0;padding:0;background:#fafafa;color:#18181b;font-family:-apple-system,BlinkMacSystemFont,"Inter",sans-serif;line-height:1.6}
        .outer{background:linear-gradient(to-t,rgba(244,244,245,0.5) 0%,rgba(250,250,250,0.3) 50%,rgba(244,244,245,0.2) 100%);min-height:100vh;padding:40px 20px}
        .container{max-width:680px;margin:0 auto}
        .card{background:#ffffff;border:1px solid #e4e4e7;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05)}
        .header{padding:32px 40px;background:linear-gradient(135deg,${actionColor} 0%,${actionColor}dd 100%);color:#ffffff}
        .brand{font-weight:700;font-size:28px;letter-spacing:-0.025em}
        .subtitle{font-size:16px;margin-top:6px;font-weight:500;opacity:0.95}
        .content{padding:40px 40px 32px}
        .alert{background:#fffbeb;border:1px solid #fed7aa;border-radius:12px;padding:20px;margin:20px 0;color:#92400e}
        .meeting-details{background:#f4f4f5;border:1px solid #e4e4e7;border-radius:12px;padding:24px;margin:24px 0}
        .field{margin:12px 0}
        .label{display:block;color:#71717a;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;font-weight:600}
        .value{font-size:16px;color:#18181b;font-weight:500}
        .btn-container{text-align:center;margin:32px 0}
        .btn{display:inline-block;background:${actionColor};color:#ffffff;text-decoration:none;padding:16px 32px;border-radius:12px;font-weight:600;font-size:16px;transition:all 0.3s ease;letter-spacing:-0.025em}
        .btn:hover{opacity:0.9;transform:translateY(-1px)}
        .security-note{background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:16px;margin:24px 0;color:#0c4a6e;font-size:14px}
        .footer{text-align:center;margin-top:32px;padding:24px;color:#71717a;font-size:13px;background:#f4f4f5;border-radius:12px;border:1px solid #e4e4e7;font-weight:500}
      </style>
    </head>
    <body>
      <div class="outer">
        <div class="container">
          <div class="card">
            <div class="header">
              <div class="brand">MK</div>
              <div class="subtitle">${actionEmoji} Verify Meeting ${actionTitle}</div>
            </div>
            <div class="content">
              <div class="alert">
                <strong>Action Required:</strong> Please verify your meeting ${actionText} by clicking the button below.
              </div>
              
              <h2>Meeting Details</h2>
              <div class="meeting-details">
                <div class="field">
                  <span class="label">Meeting Reference</span>
                  <div class="value">${meeting.id}</div>
                </div>
                <div class="field">
                  <span class="label">Scheduled Time</span>
                  <div class="value">${meeting.proposed_time}</div>
                </div>
                <div class="field">
                  <span class="label">Meeting Link</span>
                  <div class="value">${meeting.meeting_link || "TBD"}</div>
                </div>
                ${reason ? `
                  <div class="field">
                    <span class="label">Reason</span>
                    <div class="value">${reason}</div>
                  </div>
                ` : ""}
                ${newPreferredTimes ? `
                  <div class="field">
                    <span class="label">New Preferred Times</span>
                    <div class="value">${newPreferredTimes}</div>
                  </div>
                ` : ""}
              </div>
              
              <div class="btn-container">
                <a class="btn" href="${verificationUrl}" target="_blank" rel="noopener noreferrer">
                  ${actionEmoji} Verify ${actionTitle} \u2192
                </a>
              </div>
              
              <div class="security-note">
                <strong>\u{1F512} Security Notice:</strong> This verification link is required to prevent unauthorized changes to your meeting. 
                The link will expire in 24 hours and can only be used once.
              </div>
              
              <p><strong>What happens next?</strong></p>
              <ul>
                <li>Click the verification button above</li>
                <li>Your ${actionText} will be processed immediately</li>
                <li>You'll receive a confirmation email</li>
                <li>Our team will be notified of the change</li>
              </ul>
              
              <p>If you didn't request this ${actionText}, please ignore this email or contact us at showyouhow83@gmail.com</p>
            </div>
            <div class="footer">
              This verification email was sent by <strong>MannyKnows</strong><br>
              Secure meeting management \xB7 Professional business operations
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}
var Service, ServiceRegistry, emailVerificationAIComponent, phoneVerificationAIComponent, sessionManagementAIComponent, fetchWebsiteComponent, seoAnalysisComponent, performanceComponent, securityComponent, opportunityDetectionComponent, aiReadinessComponent, ServiceOrchestrator, serviceOrchestrator, ProfileManager, serviceCache, ServiceArchitecture, TokenBudgetManager, CONFIG_DATA, PromptBuilder, development, production, envConfigs, InputValidator, __vite_import_meta_env__2, prerender3, getCorsHeaders, OPTIONS, GET3, POST2, _page4, page4;
var init_chat_astro = __esm({
  "dist/_worker.js/pages/api/chat.astro.mjs"() {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_kvEncryption_B8t_dpS8();
    init_renderers();
    globalThis.process ??= {};
    globalThis.process.env ??= {};
    Service = class {
      static {
        __name(this, "Service");
      }
      name;
      components;
      config;
      constructor(name, config2 = {}) {
        this.name = name;
        this.components = /* @__PURE__ */ new Map();
        this.config = {
          enabled: true,
          requiresVerification: true,
          maxExecutionTime: 3e4,
          ...config2
        };
      }
      // Add a component to this service
      addComponent(name, component) {
        this.components.set(name, component);
      }
      // Remove a component from this service
      removeComponent(name) {
        return this.components.delete(name);
      }
      // Update component configuration
      updateComponent(name, updates) {
        const component = this.components.get(name);
        if (!component) return false;
        this.components.set(name, { ...component, ...updates });
        return true;
      }
      // Execute all enabled components
      async execute(input) {
        const results = {};
        const errors = [];
        let success = true;
        const sortedComponents = Array.from(this.components.entries()).filter(([_, component]) => component.config.enabled).sort(([_, a], [__, b]) => a.config.priority - b.config.priority);
        let componentInput = { ...input };
        for (const [name, component] of sortedComponents) {
          try {
            const timeout = component.config.timeout || 1e4;
            const result = await Promise.race([
              component.execute(componentInput),
              new Promise(
                (_, reject) => setTimeout(() => reject(new Error(`Component ${name} timeout`)), timeout)
              )
            ]);
            results[name] = result;
            componentInput = { ...componentInput, [name]: result };
          } catch (error4) {
            console.error(`Component ${name} failed:`, error4);
            const errorMessage = error4 instanceof Error ? error4.message : String(error4);
            errors.push(`${name}: ${errorMessage}`);
            success = false;
          }
        }
        return {
          success,
          data: results,
          errors: errors.length > 0 ? errors : void 0,
          componentResults: results
        };
      }
      // Get service status and component info
      getStatus() {
        return {
          name: this.name,
          enabled: this.config.enabled,
          componentCount: this.components.size,
          enabledComponents: Array.from(this.components.entries()).filter(([_, component]) => component.config.enabled).map(([name, component]) => ({
            name,
            priority: component.config.priority,
            enabled: component.config.enabled
          })).sort((a, b) => a.priority - b.priority)
        };
      }
    };
    ServiceRegistry = class {
      static {
        __name(this, "ServiceRegistry");
      }
      services = /* @__PURE__ */ new Map();
      // Register a service
      register(service) {
        this.services.set(service.name, service);
      }
      // Get a service
      get(name) {
        return this.services.get(name);
      }
      // List all services
      list() {
        return Array.from(this.services.values()).map((service) => ({
          name: service.name,
          status: service.getStatus()
        }));
      }
      // Execute a service
      async execute(serviceName, input) {
        const service = this.services.get(serviceName);
        if (!service) {
          throw new Error(`Service ${serviceName} not found`);
        }
        if (!service.config.enabled) {
          throw new Error(`Service ${serviceName} is disabled`);
        }
        return await service.execute(input);
      }
      // Get service status
      getServiceStatus(serviceName) {
        const service = this.services.get(serviceName);
        return service?.getStatus() || null;
      }
      // Get list of available services
      getAvailableServices() {
        return Array.from(this.services.keys());
      }
      // Get list of enabled services
      getEnabledServices() {
        return Array.from(this.services.entries()).filter(([_, service]) => service.config.enabled).map(([name, _]) => name);
      }
    };
    emailVerificationAIComponent = {
      name: "email_verification_ai",
      config: {
        enabled: true,
        priority: 1,
        timeout: 1e4
      },
      async execute(input) {
        const { session_id, email, kv } = input;
        if (!session_id || !email || !kv) {
          throw new Error("Missing required parameters for email verification");
        }
        const existingSession = await kv.get(`session:${session_id}`);
        if (existingSession) {
          const sessionData = JSON.parse(existingSession);
          if (sessionData.verified && sessionData.userEmail === email) {
            return {
              status: "already_verified",
              email,
              sessionData,
              message: "User already verified in this session"
            };
          }
        }
        const userData = await kv.get(`user:${email}`);
        if (userData) {
          const user = JSON.parse(userData);
          if (user.verified) {
            await kv.put(`session:${session_id}`, JSON.stringify({
              userEmail: email,
              verified: true,
              verifiedAt: (/* @__PURE__ */ new Date()).toISOString(),
              userProfile: user
            }), { expirationTtl: 3600 });
            return {
              status: "verified",
              email,
              userProfile: user,
              message: "User verified and session updated"
            };
          }
        }
        return {
          status: "needs_verification",
          email,
          message: "User requires email verification before proceeding"
        };
      }
    };
    phoneVerificationAIComponent = {
      name: "phone_verification_ai",
      config: {
        enabled: false,
        // Disabled until implemented
        priority: 2,
        timeout: 15e3
      },
      async execute(input) {
        const { session_id, phone, kv } = input;
        throw new Error("Phone verification not yet implemented");
      }
    };
    sessionManagementAIComponent = {
      name: "session_management_ai",
      config: {
        enabled: true,
        priority: 0,
        // Highest priority
        timeout: 5e3
      },
      async execute(input) {
        const { session_id, kv } = input;
        if (!session_id || !kv) {
          throw new Error("Missing session_id or kv for session management");
        }
        const sessionData = await kv.get(`session:${session_id}`);
        if (sessionData) {
          const session = JSON.parse(sessionData);
          return {
            exists: true,
            data: session,
            verified: session.verified || false,
            userEmail: session.userEmail || null,
            userProfile: session.userProfile || null
          };
        }
        const newSession = {
          created: (/* @__PURE__ */ new Date()).toISOString(),
          verified: false,
          interactions: []
        };
        await kv.put(`session:${session_id}`, JSON.stringify(newSession), {
          expirationTtl: 3600
        });
        return {
          exists: false,
          data: newSession,
          verified: false,
          userEmail: null,
          userProfile: null
        };
      }
    };
    fetchWebsiteComponent = {
      name: "fetch_website",
      config: { enabled: true, priority: 1, timeout: 15e3 },
      execute: /* @__PURE__ */ __name(async (input) => {
        const startTime = input.startTime || Date.now();
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 1e4);
          const response = await fetch(input.url, {
            headers: {
              "User-Agent": "MK-WebAnalyzer/1.0",
              "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
            },
            redirect: "follow",
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          const html = await response.text();
          const responseTime = Date.now() - startTime;
          return {
            html,
            statusCode: response.status,
            headers: Object.fromEntries(response.headers.entries()),
            responseTime,
            url: response.url,
            // Final URL after redirects
            success: response.ok
          };
        } catch (error4) {
          throw new Error(`Failed to fetch website: ${error4 instanceof Error ? error4.message : String(error4)}`);
        }
      }, "execute")
    };
    seoAnalysisComponent = {
      name: "seo_analysis",
      config: { enabled: true, priority: 2 },
      execute: /* @__PURE__ */ __name(async (input) => {
        const { html, url } = input.fetch_website;
        try {
          const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
          const title2 = titleMatch ? titleMatch[1].trim() : "";
          const metaDescMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
          const metaDescription = metaDescMatch ? metaDescMatch[1] : "";
          const h1Matches = html.match(/<h1[^>]*>/gi) || [];
          const h1Count = h1Matches.length;
          const imgMatches = html.match(/<img[^>]*>/gi) || [];
          const totalImages = imgMatches.length;
          const imagesWithAlt = imgMatches.filter((img) => img.includes("alt=")).length;
          let score = 100;
          const issues = [];
          if (!title2) {
            score -= 20;
            issues.push("Missing page title");
          } else if (title2.length < 30 || title2.length > 60) {
            score -= 10;
            issues.push(`Title length is ${title2.length} characters (optimal: 30-60)`);
          }
          if (!metaDescription) {
            score -= 15;
            issues.push("Missing meta description");
          } else if (metaDescription.length < 120 || metaDescription.length > 160) {
            score -= 5;
            issues.push(`Meta description length is ${metaDescription.length} characters (optimal: 120-160)`);
          }
          if (h1Count === 0) {
            score -= 15;
            issues.push("Missing H1 tag");
          } else if (h1Count > 1) {
            score -= 10;
            issues.push(`Multiple H1 tags found: ${h1Count}`);
          }
          if (totalImages > 0 && imagesWithAlt < totalImages) {
            score -= 10;
            issues.push(`${totalImages - imagesWithAlt} images missing alt text`);
          }
          return {
            title: title2,
            titleLength: title2.length,
            metaDescription,
            metaDescriptionLength: metaDescription.length,
            h1Count,
            totalImages,
            imagesWithAlt,
            score: Math.max(0, score),
            issues,
            recommendations: generateSEORecommendations(issues)
          };
        } catch (error4) {
          throw new Error(`SEO analysis failed: ${error4 instanceof Error ? error4.message : String(error4)}`);
        }
      }, "execute")
    };
    performanceComponent = {
      name: "performance_analysis",
      config: { enabled: true, priority: 3 },
      execute: /* @__PURE__ */ __name(async (input) => {
        const { html, responseTime } = input.fetch_website;
        try {
          const pageSizeKB = Math.round(new Blob([html]).size / 1024);
          let score = 100;
          if (responseTime > 3e3) score -= 40;
          else if (responseTime > 2e3) score -= 25;
          else if (responseTime > 1e3) score -= 15;
          else if (responseTime > 500) score -= 5;
          const issues = [];
          const recommendations = [];
          if (responseTime > 3e3) {
            issues.push(`Slow response time: ${responseTime}ms`);
            recommendations.push("Optimize server response time");
            recommendations.push("Enable compression");
            recommendations.push("Optimize images");
          }
          if (pageSizeKB > 500) {
            score -= 10;
            issues.push(`Large page size: ${pageSizeKB}KB`);
            recommendations.push("Minify CSS and JavaScript");
            recommendations.push("Compress images");
          }
          const cssMatches = html.match(/<link[^>]+rel=["']stylesheet["'][^>]*>/gi) || [];
          const jsMatches = html.match(/<script[^>]*src=[^>]*><\/script>/gi) || [];
          if (cssMatches.length > 3) {
            score -= 5;
            issues.push(`Multiple CSS files: ${cssMatches.length}`);
            recommendations.push("Combine CSS files");
          }
          if (jsMatches.length > 3) {
            score -= 5;
            issues.push(`Multiple JavaScript files: ${jsMatches.length}`);
            recommendations.push("Combine JavaScript files");
          }
          return {
            responseTime,
            pageSizeKB,
            score: Math.max(0, score),
            issues,
            recommendations,
            cssFiles: cssMatches.length,
            jsFiles: jsMatches.length
          };
        } catch (error4) {
          throw new Error(`Performance analysis failed: ${error4 instanceof Error ? error4.message : String(error4)}`);
        }
      }, "execute")
    };
    securityComponent = {
      name: "security_analysis",
      config: { enabled: true, priority: 4 },
      execute: /* @__PURE__ */ __name(async (input) => {
        const { url, headers } = input.fetch_website;
        try {
          const isHTTPS = url.startsWith("https://");
          const hasHSTS = "strict-transport-security" in headers;
          const hasXFrameOptions = "x-frame-options" in headers;
          const hasXContentTypeOptions = "x-content-type-options" in headers;
          const hasCSP = "content-security-policy" in headers;
          let score = isHTTPS ? 70 : 20;
          const issues = [];
          const recommendations = [];
          if (!isHTTPS) {
            issues.push("Not using HTTPS");
            recommendations.push("Implement SSL certificate");
          }
          if (!hasHSTS && isHTTPS) {
            score -= 10;
            issues.push("Missing HSTS header");
            recommendations.push("Add Strict-Transport-Security header");
          } else if (hasHSTS) {
            score += 10;
          }
          if (!hasXFrameOptions) {
            score -= 5;
            issues.push("Missing X-Frame-Options header");
            recommendations.push("Add X-Frame-Options header to prevent clickjacking");
          } else {
            score += 5;
          }
          if (!hasXContentTypeOptions) {
            score -= 5;
            issues.push("Missing X-Content-Type-Options header");
            recommendations.push("Add X-Content-Type-Options: nosniff header");
          } else {
            score += 5;
          }
          if (!hasCSP) {
            score -= 10;
            issues.push("Missing Content Security Policy");
            recommendations.push("Implement Content Security Policy");
          } else {
            score += 15;
          }
          return {
            isHTTPS,
            hasHSTS,
            hasXFrameOptions,
            hasXContentTypeOptions,
            hasCSP,
            score: Math.max(0, Math.min(100, score)),
            issues,
            recommendations,
            securityHeaders: {
              "strict-transport-security": headers["strict-transport-security"] || null,
              "x-frame-options": headers["x-frame-options"] || null,
              "x-content-type-options": headers["x-content-type-options"] || null,
              "content-security-policy": headers["content-security-policy"] || null
            }
          };
        } catch (error4) {
          throw new Error(`Security analysis failed: ${error4 instanceof Error ? error4.message : String(error4)}`);
        }
      }, "execute")
    };
    opportunityDetectionComponent = {
      name: "opportunity_detection",
      config: { enabled: true, priority: 5 },
      execute: /* @__PURE__ */ __name(async (input) => {
        try {
          const opportunities = [];
          const seo = input.seo_analysis;
          const performance3 = input.performance_analysis;
          const security = input.security_analysis;
          if (seo.score < 70) {
            opportunities.push({
              type: "seo",
              title: "SEO Optimization",
              description: "Poor search visibility limiting organic traffic growth",
              impact: seo.score < 50 ? "high" : "medium",
              service: "seo_optimization",
              urgency: "high",
              revenue_impact: "potential thousands in monthly search traffic"
            });
          }
          if (performance3.score < 80) {
            opportunities.push({
              type: "performance",
              title: "Site Speed Optimization",
              description: "Slow loading times causing visitor abandonment and lost conversions",
              impact: performance3.responseTime > 3e3 ? "high" : "medium",
              service: "performance_optimization",
              urgency: "high",
              revenue_impact: "up to 25% conversion rate improvement"
            });
          }
          if (security.score < 80) {
            opportunities.push({
              type: "security",
              title: "Security Enhancement",
              description: "Security vulnerabilities damaging customer trust and search rankings",
              impact: !security.isHTTPS ? "high" : "medium",
              service: "security_hardening",
              urgency: "medium",
              revenue_impact: "improved customer confidence and search rankings"
            });
          }
          const leadScore = calculateLeadScore(opportunities, seo, performance3, security);
          return {
            opportunities,
            leadScore,
            overallScore: Math.round((seo.score + performance3.score + security.score) / 3),
            primaryIssue: determinePrimaryIssue(seo, performance3, security),
            urgencyLevel: determineUrgencyLevel(opportunities)
          };
        } catch (error4) {
          throw new Error(`Opportunity detection failed: ${error4 instanceof Error ? error4.message : String(error4)}`);
        }
      }, "execute")
    };
    __name(generateSEORecommendations, "generateSEORecommendations");
    __name(calculateLeadScore, "calculateLeadScore");
    __name(determinePrimaryIssue, "determinePrimaryIssue");
    __name(determineUrgencyLevel, "determineUrgencyLevel");
    aiReadinessComponent = {
      name: "ai_readiness_analysis",
      config: { enabled: true, priority: 6, timeout: 8e3 },
      execute: /* @__PURE__ */ __name(async (input) => {
        try {
          const aiReadinessScore = calculateAIReadinessScore(input);
          const automationOpportunities = identifyAutomationOpportunities(input);
          const aiAgentRecommendations = generateAIAgentRecommendations(aiReadinessScore, automationOpportunities);
          return {
            success: true,
            data: {
              readinessScore: aiReadinessScore,
              readinessLevel: getReadinessLevel(aiReadinessScore.overall),
              automationOpportunities,
              aiAgentRecommendations,
              businessImpact: calculateBusinessImpact(automationOpportunities),
              nextSteps: generateNextSteps(aiReadinessScore.overall)
            }
          };
        } catch (error4) {
          return {
            success: false,
            error: error4 instanceof Error ? error4.message : "AI readiness analysis failed"
          };
        }
      }, "execute")
    };
    __name(calculateAIReadinessScore, "calculateAIReadinessScore");
    __name(analyzeDataQuality, "analyzeDataQuality");
    __name(analyzeTechnicalReadiness, "analyzeTechnicalReadiness");
    __name(analyzeContentStructure, "analyzeContentStructure");
    __name(analyzeUXForAutomation, "analyzeUXForAutomation");
    __name(analyzeBusinessProcessMaturity, "analyzeBusinessProcessMaturity");
    __name(identifyAutomationOpportunities, "identifyAutomationOpportunities");
    __name(generateAIAgentRecommendations, "generateAIAgentRecommendations");
    __name(calculateBusinessImpact, "calculateBusinessImpact");
    __name(generateNextSteps, "generateNextSteps");
    __name(getReadinessLevel, "getReadinessLevel");
    __name(createAdvancedWebAnalysisService, "createAdvancedWebAnalysisService");
    __name(createCompetitiveIntelligenceService, "createCompetitiveIntelligenceService");
    __name(createDigitalMarketingAuditService, "createDigitalMarketingAuditService");
    __name(createBusinessGrowthOptimizerService, "createBusinessGrowthOptimizerService");
    __name(createAIServicesRegistry, "createAIServicesRegistry");
    __name(createUserServicesRegistry, "createUserServicesRegistry");
    ServiceOrchestrator = class {
      static {
        __name(this, "ServiceOrchestrator");
      }
      aiServices;
      userServices;
      constructor() {
        this.aiServices = createAIServicesRegistry();
        this.userServices = createUserServicesRegistry();
      }
      /**
       * Execute a user service with proper AI service verification chain
       */
      async executeUserService(serviceName, input, context2) {
        const aiServicesExecuted = [];
        let sessionData = null;
        try {
          const sessionResult = await this.aiServices.execute("ai_session_management", {
            session_id: context2.session_id,
            kv: context2.kv
          });
          aiServicesExecuted.push("ai_session_management");
          sessionData = sessionResult.data;
          if (!sessionData || !sessionData.data) {
            sessionData = {
              success: true,
              data: {
                serviceHistory: [],
                session_id: context2.session_id,
                created_at: (/* @__PURE__ */ new Date()).toISOString()
              }
            };
          }
          const userService = this.userServices.get(serviceName);
          if (!userService) {
            throw new Error(`User service ${serviceName} not found`);
          }
          if (userService.config.requiresVerification && context2.email) {
            const emailVerificationResult = await this.aiServices.execute("ai_email_verification", {
              session_id: context2.session_id,
              email: context2.email,
              kv: context2.kv
            });
            aiServicesExecuted.push("ai_email_verification");
            if (emailVerificationResult.data.status === "needs_verification") {
              return {
                success: false,
                data: {
                  requiresVerification: true,
                  email: context2.email,
                  sessionData
                },
                errors: ["Email verification required before proceeding"],
                aiServicesExecuted
              };
            }
          }
          if (userService.config.requiresPhoneVerification) {
            throw new Error("Phone verification not yet implemented");
          }
          const userServiceResult = await this.userServices.execute(serviceName, {
            ...input,
            sessionData,
            ...context2
          });
          if (userServiceResult.success && context2.kv && sessionData?.data) {
            const updatedSession = {
              ...sessionData.data,
              lastServiceExecuted: serviceName,
              lastExecutionTime: (/* @__PURE__ */ new Date()).toISOString(),
              serviceHistory: [
                ...sessionData.data.serviceHistory || [],
                {
                  service: serviceName,
                  executedAt: (/* @__PURE__ */ new Date()).toISOString(),
                  success: true
                }
              ]
            };
            await context2.kv.put(`session:${context2.session_id}`, JSON.stringify(updatedSession), {
              expirationTtl: 3600
            });
          }
          return {
            success: true,
            data: userServiceResult.data,
            errors: userServiceResult.errors,
            aiServicesExecuted,
            userServiceExecuted: serviceName
          };
        } catch (error4) {
          console.error("Service orchestration error:", error4);
          return {
            success: false,
            data: null,
            errors: [error4 instanceof Error ? error4.message : String(error4)],
            aiServicesExecuted
          };
        }
      }
      /**
       * Get available user services (enabled only)
       */
      getAvailableUserServices() {
        return this.userServices.getEnabledServices();
      }
      /**
       * Get AI services status
       */
      getAIServicesStatus() {
        return this.aiServices.list();
      }
      /**
       * Get user services status  
       */
      getUserServicesStatus() {
        return this.userServices.list();
      }
    };
    serviceOrchestrator = new ServiceOrchestrator();
    __name(devLog, "devLog");
    __name(errorLog, "errorLog");
    ProfileManager = class {
      static {
        __name(this, "ProfileManager");
      }
      kv;
      constructor(kv) {
        this.kv = kv;
      }
      /**
       * Get or create user profile
       */
      async getUserProfile(sessionId) {
        const sessionData = await this.kv.get(`session:${sessionId}`);
        if (sessionData) {
          const session = JSON.parse(sessionData);
          if (session.profileId) {
            const profile3 = await this.kv.get(`profile:${session.profileId}`);
            if (profile3) {
              const userProfile = JSON.parse(profile3);
              userProfile.currentSessionId = sessionId;
              userProfile.lastSeen = Date.now();
              return userProfile;
            }
          }
        }
        const newProfile = {
          id: `anon_${crypto.randomUUID()}`,
          type: "anonymous",
          created: Date.now(),
          lastSeen: Date.now(),
          interactions: 0,
          sessionsCount: 1,
          totalTimeSpent: 0,
          trustScore: 0,
          engagementScore: 0,
          freeServicesUsed: [],
          premiumServicesAttempted: [],
          premiumServicesUsed: [],
          emailRequested: false,
          emailVerified: false,
          currentSessionId: sessionId,
          sessionIds: [sessionId],
          preferences: {},
          behaviorPatterns: {},
          conversionPotential: 0
        };
        await this.saveProfile(newProfile);
        await this.linkSessionToProfile(sessionId, newProfile.id);
        return newProfile;
      }
      /**
       * Update profile after interaction
       */
      async trackInteraction(profile3, interactionType, metadata = {}) {
        profile3.interactions++;
        profile3.lastSeen = Date.now();
        const trustIncrement = this.calculateTrustIncrement(interactionType, metadata);
        profile3.trustScore += trustIncrement;
        profile3.engagementScore = this.calculateEngagementScore(profile3);
        profile3.conversionPotential = this.calculateConversionPotential(profile3);
        this.updateBehaviorPatterns(profile3, interactionType, metadata);
        await this.saveProfile(profile3);
        return profile3;
      }
      /**
       * Track service usage
       */
      async trackServiceUsage(profile3, serviceName, serviceType, success = true) {
        if (serviceType === "free" && success) {
          if (!profile3.freeServicesUsed.includes(serviceName)) {
            profile3.freeServicesUsed.push(serviceName);
          }
        } else if (serviceType === "premium") {
          if (success) {
            if (!profile3.premiumServicesUsed.includes(serviceName)) {
              profile3.premiumServicesUsed.push(serviceName);
            }
          } else {
            if (!profile3.premiumServicesAttempted.includes(serviceName)) {
              profile3.premiumServicesAttempted.push(serviceName);
            }
          }
        }
        return await this.trackInteraction(profile3, "service_usage", {
          serviceName,
          serviceType,
          success
        });
      }
      /**
       * Mark email as requested
       */
      async markEmailRequested(profile3) {
        profile3.emailRequested = true;
        profile3.emailRequestedAt = Date.now();
        return await this.trackInteraction(profile3, "email_requested");
      }
      /**
       * Verify user email
       */
      async verifyEmail(profile3, email) {
        profile3.email = email;
        profile3.emailVerified = true;
        profile3.emailVerifiedAt = Date.now();
        profile3.type = "verified";
        profile3.trustScore += 20;
        const oldId = profile3.id;
        profile3.id = `user:${email}`;
        await this.saveProfile(profile3);
        await this.kv.delete(`profile:${oldId}`);
        return profile3;
      }
      /**
       * Check if user should be asked for email
       */
      shouldRequestEmail(profile3, context2) {
        if (profile3.emailRequested || profile3.emailVerified) {
          return false;
        }
        const triggers = [
          // Engagement-based triggers
          profile3.interactions >= 3,
          profile3.freeServicesUsed.length >= 2,
          profile3.trustScore >= 10,
          profile3.engagementScore >= 15,
          // Premium service attempts
          profile3.premiumServicesAttempted.length > 0,
          // Service-specific triggers
          context2.serviceName === "analyze_website",
          context2.message?.toLowerCase().includes("detailed report"),
          context2.message?.toLowerCase().includes("comprehensive analysis"),
          // High conversion potential
          profile3.conversionPotential >= 0.7
        ];
        return triggers.some(Boolean);
      }
      /**
       * Calculate trust increment based on interaction
       */
      calculateTrustIncrement(interactionType, metadata) {
        const trustMap = {
          "message_sent": 1,
          "service_usage": 2,
          "free_service_completed": 3,
          "premium_service_attempted": 1,
          "email_provided": 5,
          "email_verified": 20,
          "return_visit": 2
        };
        return trustMap[interactionType] || 0;
      }
      /**
       * Calculate overall engagement score
       */
      calculateEngagementScore(profile3) {
        const baseScore = profile3.interactions * 2;
        const serviceBonus = profile3.freeServicesUsed.length * 5;
        const discoveryCallBonus = profile3.freeServicesUsed.includes("schedule_discovery_call") ? 25 : 0;
        const timeBonus = Math.min(profile3.totalTimeSpent / 6e4, 10);
        const returnVisitBonus = profile3.sessionsCount * 3;
        return Math.min(baseScore + serviceBonus + discoveryCallBonus + timeBonus + returnVisitBonus, 100);
      }
      /**
       * Calculate conversion potential (0-1 scale)
       */
      calculateConversionPotential(profile3) {
        const factors = [
          profile3.interactions >= 3 ? 0.2 : 0,
          profile3.freeServicesUsed.length >= 2 ? 0.25 : 0,
          profile3.premiumServicesAttempted.length > 0 ? 0.3 : 0,
          profile3.freeServicesUsed.includes("schedule_discovery_call") ? 0.4 : 0,
          // Discovery call scheduled = high intent
          profile3.trustScore >= 15 ? 0.15 : 0,
          profile3.sessionsCount >= 2 ? 0.1 : 0
        ];
        return Math.min(factors.reduce((sum, factor) => sum + factor, 0), 1);
      }
      /**
       * Update behavior patterns
       */
      updateBehaviorPatterns(profile3, interactionType, metadata) {
        if (!profile3.behaviorPatterns[interactionType]) {
          profile3.behaviorPatterns[interactionType] = 0;
        }
        profile3.behaviorPatterns[interactionType]++;
        const hour = (/* @__PURE__ */ new Date()).getHours();
        const timeSlot = `hour_${hour}`;
        if (!profile3.behaviorPatterns[timeSlot]) {
          profile3.behaviorPatterns[timeSlot] = 0;
        }
        profile3.behaviorPatterns[timeSlot]++;
      }
      /**
       * Save profile to KV storage
       */
      async saveProfile(profile3) {
        await this.kv.put(`profile:${profile3.id}`, JSON.stringify(profile3));
      }
      /**
       * Link session to profile
       */
      async linkSessionToProfile(sessionId, profileId) {
        await this.kv.put(`session:${sessionId}`, JSON.stringify({ profileId }));
      }
    };
    serviceCache = null;
    __name(createServiceArchitecture, "createServiceArchitecture");
    ServiceArchitecture = class {
      static {
        __name(this, "ServiceArchitecture");
      }
      services = /* @__PURE__ */ new Map();
      initialized = false;
      environment;
      constructor(environment) {
        this.environment = environment;
      }
      // Load services from KV first, fallback to hardcoded defaults
      async ensureServicesLoaded() {
        if (this.initialized && this.isCacheValid()) {
          console.log("Using cached services");
          return;
        }
        console.log("Loading services...");
        try {
          const kvServices = await this.loadFromKV();
          if (kvServices && kvServices.length > 0) {
            console.log(`Successfully loaded ${kvServices.length} services from KV`);
            this.loadServicesFromArray(kvServices);
            this.updateCache(kvServices);
            this.initialized = true;
            return;
          }
        } catch (error4) {
          console.warn("Failed to load services from KV, falling back to defaults:", error4);
        }
        console.log("Loading default services as fallback");
        this.loadDefaultServices();
        this.initialized = true;
      }
      async loadFromKV() {
        const kvNamespace = this.environment?.KV_SERVICES;
        if (!kvNamespace) {
          console.log("KV_SERVICES namespace not available in environment");
          return null;
        }
        try {
          const latestVersion = await kvNamespace.get("services_latest");
          if (!latestVersion) {
            console.log("No services_latest pointer found in KV");
            return null;
          }
          console.log("Loading services from KV version:", latestVersion);
          const serviceDataRaw = await kvNamespace.get(latestVersion);
          if (!serviceDataRaw) {
            console.log("No service data found for version:", latestVersion);
            return null;
          }
          const serviceData = JSON.parse(serviceDataRaw);
          console.log(`Loaded ${serviceData.services.length} services from KV`);
          return serviceData.services.filter((service) => service.isActive !== false);
        } catch (error4) {
          console.error("Error loading services from KV:", error4);
          return null;
        }
      }
      isCacheValid() {
        if (!serviceCache) return false;
        const now = Date.now();
        return now - serviceCache.timestamp < serviceCache.ttl;
      }
      updateCache(services) {
        serviceCache = {
          data: services,
          timestamp: Date.now(),
          ttl: 5 * 60 * 1e3
          // 5 minutes
        };
      }
      loadServicesFromArray(services) {
        this.services.clear();
        services.forEach((service) => {
          this.services.set(service.name, service);
        });
      }
      loadDefaultServices() {
        const defaultServices = [
          // Core AI Tools - Available to all users
          {
            name: "website_analysis",
            displayName: "Website Analysis",
            description: "Comprehensive analysis of website performance, SEO, and conversion optimization opportunities.",
            accessLevel: "public",
            serviceType: "ai_tool",
            businessCategory: "analytics",
            deliveryMethod: "instant",
            hasAIAssistance: true,
            canDemoInChat: true,
            aiCostLevel: "medium",
            processingTime: "instant",
            functionName: "analyze_website",
            parameters: { url: "string", depth: "number" },
            shortDescription: "SEO & Performance Analysis",
            price: "Free Analysis",
            isActive: true,
            sortOrder: 1
          },
          {
            name: "competitor_analysis",
            displayName: "Competitive Intelligence",
            description: "Comprehensive competitor analysis including traffic analysis, keyword research, and strategic positioning insights.",
            accessLevel: "public",
            serviceType: "ai_tool",
            businessCategory: "analytics",
            deliveryMethod: "instant",
            hasAIAssistance: true,
            canDemoInChat: true,
            aiCostLevel: "medium",
            processingTime: "instant",
            functionName: "analyze_competitors",
            parameters: { competitor_urls: "array", analysis_focus: "array", your_website: "string" },
            shortDescription: "Know Your Competition",
            price: "Free Analysis",
            isActive: true,
            sortOrder: 2
          },
          {
            name: "ai_content_generator",
            displayName: "AI Content Creation",
            description: "AI-powered content generation for blogs, social media, product descriptions, and marketing copy with brand voice training.",
            accessLevel: "public",
            serviceType: "ai_tool",
            businessCategory: "content",
            deliveryMethod: "instant",
            hasAIAssistance: true,
            canDemoInChat: true,
            aiCostLevel: "low",
            processingTime: "instant",
            functionName: "generate_content",
            parameters: { content_type: "string", topic: "string", brand_voice: "string", target_length: "number" },
            shortDescription: "Instant Quality Content",
            price: "Free Trial",
            isActive: true,
            sortOrder: 3
          },
          // Premium AI Services
          {
            name: "chatbot_development",
            displayName: "Custom AI Chatbots",
            description: "Intelligent chatbots trained on your business data to handle customer service, sales qualification, and lead generation 24/7.",
            accessLevel: "premium",
            serviceType: "ai_tool",
            businessCategory: "ai_agents",
            deliveryMethod: "project",
            hasAIAssistance: true,
            canDemoInChat: true,
            aiCostLevel: "high",
            processingTime: "1-2 weeks",
            functionName: "create_custom_chatbot",
            parameters: { business_type: "string", use_cases: "array", integration_requirements: "array" },
            shortDescription: "24/7 AI Assistant",
            price: "Starting at $797",
            isActive: true,
            sortOrder: 4
          },
          // Business Services
          {
            name: "website_redesign",
            displayName: "Website Redesign",
            description: "Complete website redesign focused on modern UX/UI principles, mobile optimization, and conversion-driven design.",
            accessLevel: "verified",
            serviceType: "business_service",
            businessCategory: "web_design",
            deliveryMethod: "project",
            hasAIAssistance: true,
            canDemoInChat: false,
            aiCostLevel: "low",
            processingTime: "2-4 weeks",
            functionName: "plan_website_redesign",
            parameters: { current_site: "string", goals: "array", budget_range: "string" },
            shortDescription: "Modern Website Design",
            price: "Starting at $2,497",
            isActive: true,
            sortOrder: 5
          },
          // Show Available Services Function
          {
            name: "show_available_services",
            displayName: "Available Services",
            description: "Show all available AI services and business solutions based on user access level.",
            accessLevel: "public",
            serviceType: "ai_tool",
            businessCategory: "analytics",
            deliveryMethod: "instant",
            hasAIAssistance: true,
            canDemoInChat: true,
            aiCostLevel: "low",
            processingTime: "instant",
            functionName: "show_available_services",
            parameters: {},
            shortDescription: "Explore All Services",
            price: "Free",
            isActive: true,
            sortOrder: 0
          }
        ];
        this.loadServicesFromArray(defaultServices);
      }
      addService(service) {
        this.services.set(service.name, service);
      }
      removeService(name) {
        this.services.delete(name);
      }
      getService(name) {
        return this.services.get(name);
      }
      // Updated to use businessCategory instead of old category system
      getServicesByCategory(category) {
        return Array.from(this.services.values()).filter((service) => service.businessCategory === category).sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999));
      }
      // Get services by access level
      getServicesByAccessLevel(accessLevel) {
        return Array.from(this.services.values()).filter((service) => service.accessLevel === accessLevel).sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999));
      }
      // Get services by type
      getServicesByType(serviceType) {
        return Array.from(this.services.values()).filter((service) => service.serviceType === serviceType).sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999));
      }
      // Check if user has access to specific service
      checkServiceAccess(serviceName, userTier) {
        const service = this.getService(serviceName);
        if (!service) return false;
        const accessLevelMap = {
          anonymous: ["public"],
          verified: ["public", "verified"],
          premium: ["public", "verified", "premium"]
        };
        return accessLevelMap[userTier].includes(service.accessLevel);
      }
      getAccessibleServices(profile3) {
        const userTier = this.determineUserTier(profile3);
        const accessLevels = this.getAccessLevelsForTier(userTier);
        return Array.from(this.services.values()).filter((service) => accessLevels.includes(service.accessLevel)).sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999));
      }
      getUserFacingServices() {
        return Array.from(this.services.values()).filter((service) => service.isActive !== false).sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999));
      }
      determineUserTier(profile3) {
        if (!profile3) return "anonymous";
        if (profile3.isPremium) return "premium";
        if (profile3.isVerified || profile3.email) return "verified";
        return "anonymous";
      }
      getAccessLevelsForTier(userTier) {
        switch (userTier) {
          case "premium":
            return ["public", "verified", "premium"];
          case "verified":
            return ["public", "verified"];
          case "anonymous":
          default:
            return ["public"];
        }
      }
      // Get services that can be demonstrated in chat
      getDemoableServices(userTier) {
        return this.getAccessibleServices({ isVerified: userTier !== "anonymous", isPremium: userTier === "premium" }).filter((service) => service.canDemoInChat);
      }
      // Get AI-powered services only
      getAIServices(userTier) {
        return this.getAccessibleServices({ isVerified: userTier !== "anonymous", isPremium: userTier === "premium" }).filter((service) => service.hasAIAssistance);
      }
      // Get instant delivery services
      getInstantServices(userTier) {
        return this.getAccessibleServices({ isVerified: userTier !== "anonymous", isPremium: userTier === "premium" }).filter((service) => service.deliveryMethod === "instant");
      }
      getAllServices() {
        return Array.from(this.services.values()).sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999));
      }
      getServiceCount() {
        return this.services.size;
      }
      // Smart service recommendations based on user profile
      getRecommendedServices(profile3) {
        const accessibleServices = this.getAccessibleServices(profile3);
        return accessibleServices.filter((service) => service.canDemoInChat || service.deliveryMethod === "instant").slice(0, 5);
      }
      // Get services suitable for first-time users
      getOnboardingServices() {
        return Array.from(this.services.values()).filter(
          (service) => service.accessLevel === "public" && service.canDemoInChat === true && service.deliveryMethod === "instant"
        ).sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999)).slice(0, 3);
      }
      // Legacy compatibility methods
      checkAccess(serviceName, profile3) {
        const userTier = this.determineUserTier(profile3);
        const hasAccess = this.checkServiceAccess(serviceName, userTier);
        if (hasAccess) {
          return { allowed: true };
        }
        const service = this.getService(serviceName);
        if (!service) {
          return {
            allowed: false,
            reason: "Service not found",
            message: "The requested service is not available."
          };
        }
        let suggestedAction;
        let message;
        if (service.accessLevel === "verified" && userTier === "anonymous") {
          suggestedAction = "request_email";
          message = "Please provide your email to access this service.";
        } else if (service.accessLevel === "premium") {
          suggestedAction = "upgrade_plan";
          message = "This is a premium service. Upgrade to access advanced features.";
        } else {
          suggestedAction = "engage_more";
          message = "Continue engaging to unlock more services.";
        }
        return {
          allowed: false,
          reason: `Requires ${service.accessLevel} access`,
          suggestedAction,
          message
        };
      }
    };
    TokenBudgetManager = class {
      static {
        __name(this, "TokenBudgetManager");
      }
      kv;
      tokenBudgets;
      constructor(kv, envConfig) {
        this.kv = kv;
        this.tokenBudgets = envConfig.token_budget;
      }
      /**
       * Get user's token tier based on engagement
       */
      getUserTier(profile3) {
        if (profile3.emailVerified) {
          return "verified";
        }
        if (profile3.interactions >= 3 || profile3.trustScore >= 10 || profile3.freeServicesUsed.length >= 2) {
          return "engaged";
        }
        return "anonymous";
      }
      /**
       * Get current token usage for user
       */
      async getTokenUsage(profileId) {
        const usageData = await this.kv.get(`token_usage:${profileId}`);
        if (!usageData) {
          return {
            sessionTokensUsed: 0,
            dailyTokensUsed: 0,
            lastDailyReset: Date.now()
          };
        }
        const usage = JSON.parse(usageData);
        const now = Date.now();
        const lastReset = usage.lastDailyReset || 0;
        const hoursSinceReset = (now - lastReset) / (1e3 * 60 * 60);
        if (hoursSinceReset >= 24) {
          usage.dailyTokensUsed = 0;
          usage.lastDailyReset = now;
          await this.saveTokenUsage(profileId, usage);
        }
        return usage;
      }
      /**
       * Calculate token allocation for a request
       */
      async calculateTokenAllocation(profile3) {
        const userTier = this.getUserTier(profile3);
        const budget = this.tokenBudgets[userTier];
        const usage = await this.getTokenUsage(profile3.id);
        const remainingDaily = Math.max(0, budget.daily_token_budget - usage.dailyTokensUsed);
        const remainingSession = Math.max(0, budget.session_token_budget - usage.sessionTokensUsed);
        let maxTokensForResponse = Math.min(
          budget.max_tokens_per_response,
          remainingDaily,
          remainingSession
        );
        let budgetWarning;
        const dailyUsagePercent = usage.dailyTokensUsed / budget.daily_token_budget;
        const sessionUsagePercent = usage.sessionTokensUsed / budget.session_token_budget;
        if (dailyUsagePercent > 0.9 || sessionUsagePercent > 0.9) {
          if (maxTokensForResponse < budget.max_tokens_per_response * 0.5) {
            budgetWarning = "Approaching your usage limit for today. Responses may be shorter.";
          }
        }
        if (maxTokensForResponse < 200 && remainingDaily > 0) {
          maxTokensForResponse = Math.min(500, remainingDaily);
          budgetWarning = "This will be a shorter response due to usage limits. " + (budgetWarning || "");
        }
        return {
          maxTokensForResponse,
          remainingSessionBudget: remainingSession,
          remainingDailyBudget: remainingDaily,
          userTier,
          budgetWarning
        };
      }
      /**
       * Track token usage after a response
       */
      async trackTokenUsage(profileId, promptTokens, completionTokens) {
        const usage = await this.getTokenUsage(profileId);
        const totalTokens = promptTokens + completionTokens;
        usage.sessionTokensUsed += totalTokens;
        usage.dailyTokensUsed += totalTokens;
        await this.saveTokenUsage(profileId, usage);
      }
      /**
       * Save token usage to storage
       */
      async saveTokenUsage(profileId, usage) {
        await this.kv.put(`token_usage:${profileId}`, JSON.stringify(usage), {
          expirationTtl: 86400 * 2
          // 2 days
        });
      }
      /**
       * Reset session token usage (when user starts new session)
       */
      async resetSessionUsage(profileId) {
        const usage = await this.getTokenUsage(profileId);
        usage.sessionTokensUsed = 0;
        await this.saveTokenUsage(profileId, usage);
      }
      /**
       * Get usage summary for user
       */
      async getUsageSummary(profile3) {
        const userTier = this.getUserTier(profile3);
        const budget = this.tokenBudgets[userTier];
        const usage = await this.getTokenUsage(profile3.id);
        return {
          tier: userTier,
          dailyUsage: {
            used: usage.dailyTokensUsed,
            total: budget.daily_token_budget,
            percentage: Math.round(usage.dailyTokensUsed / budget.daily_token_budget * 100)
          },
          sessionUsage: {
            used: usage.sessionTokensUsed,
            total: budget.session_token_budget,
            percentage: Math.round(usage.sessionTokensUsed / budget.session_token_budget * 100)
          },
          canUpgrade: userTier !== "verified"
        };
      }
    };
    CONFIG_DATA = {
      personas: {
        business_consultant: {
          name: "Manny",
          role: "AI representation of Manny from MannyKnows - your digital business consultant",
          company: "MannyKnows.com (MK), a premium digital studio specializing in web development, marketing, branding, and strategic business consulting",
          personality: {
            traits: ["warm", "intelligent", "solution-focused", "business-savvy", "helpful"],
            tone: "conversational and professional - speaks as Manny's digital representation in first person",
            communication_style: "natural dialogue, identifies business needs, connects problems to solutions"
          },
          expertise: [
            "web development strategy",
            "digital marketing campaigns",
            "conversion optimization",
            "business process automation",
            "ROI analysis and value proposition",
            "consultative selling and needs discovery"
          ]
        }
      },
      goals: {
        business_consultation: {
          primary_objectives: [
            "Understand what business challenges or opportunities users face",
            "Identify which MK services could provide the most value",
            "Generate qualified leads through discovery calls, email, text, or phone",
            "Sell relevant products and services naturally through conversation",
            "Provide immediate value and build trust",
            "Create opportunities for invoicing and project work"
          ],
          success_metrics: [
            "meaningful_business_conversation",
            "relevant_service_connection",
            "lead_generated_any_channel",
            "discovery_call_scheduled",
            "product_or_service_sold",
            "qualified_business_opportunity"
          ]
        }
      },
      guardrails: {
        conversation_guidelines: {
          always_do: [
            "Speak in first person as Manny's digital representation",
            "Have natural business conversations without rigid scripts",
            "Listen and understand before recommending solutions",
            "Connect business challenges to relevant MK services naturally",
            "Proactively suggest discovery calls after showing service relevance",
            "Ask for contact info when user shows genuine interest",
            "Focus on business value and outcomes in every response"
          ],
          never_do: [
            "Follow rigid conversation templates or scripts",
            "Ask too many questions in sequence - ask ONE thoughtful question at a time",
            "Request multiple pieces of information upfront (name, email, phone, times, etc.)",
            "Give users 'homework' or long lists of requirements",
            "Overwhelm with service lists",
            "Give detailed pricing (save for discovery calls)",
            "Wait for user to ask for discovery calls - suggest them naturally",
            "Sound robotic or templated",
            "Use phrases like 'I need this and this and this from you'"
          ],
          escalation_triggers: [
            "User mentions a specific business challenge MK can solve",
            "User asks about any service, pricing, or timeline",
            "User shows interest in improving their business",
            "Conversation reaches natural point to move to next step",
            "User has engaged for 2+ exchanges showing genuine interest"
          ]
        },
        content_safety: {
          prohibited_topics: [
            "Politics and controversial topics",
            "Personal financial advice",
            "Medical advice",
            "Legal advice"
          ],
          required_disclaimers: {
            pricing: "Specific pricing is discussed during our discovery call",
            timeline: "Project timelines are determined based on scope and requirements"
          }
        },
        response_limits: {
          max_response_length: 600,
          conciseness_threshold: 400,
          max_conversation_length: 20,
          session_timeout_minutes: 30
        }
      }
    };
    PromptBuilder = class {
      static {
        __name(this, "PromptBuilder");
      }
      config;
      envConfig;
      constructor(config2) {
        this.config = config2;
        const environments = {
          development: {
            persona: "business_consultant",
            goals: "lead_generation",
            model: "gpt-5-nano",
            max_tokens: 500,
            temperature: 0.7,
            debug_logging: true,
            tools_enabled: true,
            database_enabled: false,
            session_storage: "memory",
            chatbot_enabled: true
          },
          production: {
            persona: "business_consultant",
            goals: "lead_generation",
            model: "gpt-5",
            max_tokens: 500,
            temperature: 0.7,
            debug_logging: true,
            tools_enabled: true,
            database_enabled: true,
            session_storage: "cloudflare_kv",
            chatbot_enabled: true
          }
        };
        this.envConfig = environments[config2.environment];
      }
      /**
       * Build the complete system prompt from modular components
       */
      buildSystemPrompt(servicesList, categoriesCount, servicesCount, userProfile) {
        const persona = CONFIG_DATA.personas[this.config.persona];
        const goalSet = CONFIG_DATA.goals[this.config.goals];
        const guardrails = CONFIG_DATA.guardrails;
        if (!persona || !goalSet) {
          throw new Error(`Invalid persona (${this.config.persona}) or goals (${this.config.goals})`);
        }
        const userType = userProfile?.emailVerified ? "verified user" : userProfile?.interactions >= 3 ? "engaged visitor" : "new visitor";
        const systemPrompt = `You are ${persona.name}, ${persona.role}.

I represent ${persona.company} and speak in first person as Manny's digital representation.

${userProfile ? `Current user: ${userType} (${userProfile.interactions || 0} interactions, trust: ${userProfile.trustScore || 0})` : ""}

PERSONALITY: ${persona.personality.traits.join(", ")}
TONE: ${persona.personality.tone}
COMMUNICATION: ${persona.personality.communication_style}

BUSINESS GOALS:
${goalSet.primary_objectives.map((obj) => `\u2022 ${obj}`).join("\n")}

SUCCESS METRICS: ${goalSet.success_metrics.join(", ")}

${servicesList ? `MK SERVICES AVAILABLE: ${servicesList} (${servicesCount} services across ${categoriesCount} categories)` : ""}

CONVERSATION APPROACH:
Note: You have a finite token budget per session\u2014prioritize getting to a concrete next step (e.g., scheduling a discovery call) efficiently without wasting tokens.
${guardrails.conversation_guidelines.always_do.map((item) => `\u2713 ${item}`).join("\n")}

AVOID:
${guardrails.conversation_guidelines.never_do.map((item) => `\u2717 ${item}`).join("\n")}

DISCOVERY CALL STRATEGY:
${guardrails.conversation_guidelines.escalation_triggers.map((trigger) => `\u2192 ${trigger}`).join("\n")}

RESPONSE GUIDELINES:
- Keep responses under ${guardrails.response_limits.max_response_length} characters when possible
- Target ${guardrails.response_limits.conciseness_threshold} characters for optimal engagement
- Speak naturally as "I" (Manny's digital representation) not "we" or "MannyKnows"
- Focus on understanding their specific situation before proposing solutions
- When suggesting a call, frame it as value for them: "I could share some specific ideas for your situation"
- Ask for contact info ONE piece at a time: "What's the best way to reach you?" or "What's your email?"
- Let conversation flow naturally - don't rush to collect all details at once
- Build trust through empathy and understanding, not information requests

CONVERSATION FLOW:
1. Understand their business challenge/goal (ask ONE thoughtful question)
2. Connect it to relevant MK services naturally 
3. Demonstrate value/expertise through insights
4. Suggest discovery call: "This sounds like something worth discussing on a quick call"
5. If they're interested, ask for just ONE piece of contact info to start
6. Gather additional details naturally through conversation, not upfront requests

EMPATHETIC SELLING APPROACH:
- Build rapport first, sell second
- Ask ONE question at a time to understand their situation
- Show you understand their pain points before proposing solutions
- Let information emerge naturally through conversation
- When suggesting a call, make it about THEIR benefit, not your process
- Example: "Based on what you're telling me, a quick 15-minute call would let me give you some specific ideas for your situation. What's the best way to reach you?"

CONVERSATION EXAMPLES:
\u274C DON'T: "I need your name, email, phone, preferred times, and project description"
\u2705 DO: "What kind of website challenges are you facing?" \u2192 understand \u2192 "That sounds frustrating. I've helped others with similar issues..." \u2192 build value \u2192 "Want to hop on a quick call? I could share some specific ideas for your situation"

\u274C DON'T: "To get started, please provide..."
\u2705 DO: "Tell me more about what's not working with your current site"

EXPERTISE AREAS:
${persona.expertise.map((area) => `\u2022 ${area}`).join("\n")}

FUNCTION CALLING INSTRUCTIONS:
\u{1F3AF} **CRITICAL**: When user agrees to schedule a discovery call AND you have collected their basic info, you MUST call the schedule_discovery_call function immediately. Do NOT just talk about scheduling - actually execute the booking.

\u26A0\uFE0F **MANDATORY FUNCTION EXECUTION**: 
- User says: "book the call", "schedule the call", "please book", "please schedule" \u2192 CALL FUNCTION NOW
- User provides: name + email + project details \u2192 CALL FUNCTION NOW
- You have all required parameters \u2192 CALL FUNCTION NOW

REQUIRED PARAMETERS CHECK:
\u2705 name: Full name provided (e.g., "My name is John Smith", "I'm Sarah Johnson")
\u2705 email: Email address provided (e.g., "john@company.com", "my email is...")  
\u2705 project_details: Business challenge mentioned (e.g., "conversion rates", "website help", "ecommerce issues")
\u2705 preferred_times: Time mentioned OR use "flexible" as default

**WHEN ALL 4 ARE AVAILABLE \u2192 IMMEDIATELY CALL schedule_discovery_call(name, email, project_details, preferred_times)**

FUNCTION CALLING EXAMPLES:
User: "My name is John Smith, email john@company.com, I need help with conversion rates, book the call please"
\u2192 IMMEDIATELY call: schedule_discovery_call("John Smith", "john@company.com", "conversion rate optimization", "flexible")

User: "I'm Sarah, email sarah@shop.com, ecommerce issues, Thursday 2pm works"  
\u2192 IMMEDIATELY call: schedule_discovery_call("Sarah", "sarah@shop.com", "ecommerce optimization", "Thursday 2pm")

DO NOT:
\u274C Ask more questions when you have all required info
\u274C Say "I'll book that for you" without calling the function
\u274C Continue conversation when booking conditions are met
\u274C Ask for confirmation before calling the function

DO:
\u2705 Call schedule_discovery_call() immediately when conditions are met
\u2705 Extract parameters from conversation context
\u2705 Use "flexible" for preferred_times if not specified
\u2705 Respond with the actual booking results from the functionRemember: Your goal is to have empathetic, helpful conversations that naturally lead to discovery calls. Be genuinely curious about their business challenges. Ask ONE thoughtful question at a time. Build trust through understanding, not by requesting information. When you suggest a call, make it about giving them value, not gathering their details.`;
        return systemPrompt;
      }
      /**
       * Get the current environment configuration
       */
      getEnvironmentConfig() {
        return this.envConfig;
      }
      /**
       * Get guardrails for this configuration
       */
      getGuardrails() {
        return CONFIG_DATA.guardrails;
      }
      /**
       * Validate if a response meets guardrails
       */
      validateResponse(response) {
        const issues = [];
        const limits = CONFIG_DATA.guardrails.response_limits;
        if (response.length > limits.max_response_length) {
          issues.push(`Response too long (${response.length}/${limits.max_response_length} chars)`);
        }
        const prohibitedTopics = CONFIG_DATA.guardrails.content_safety.prohibited_topics;
        const lowerResponse = response.toLowerCase();
        prohibitedTopics.forEach((topic) => {
          if (lowerResponse.includes(topic.toLowerCase())) {
            issues.push(`Contains prohibited topic: ${topic}`);
          }
        });
        return {
          valid: issues.length === 0,
          issues
        };
      }
    };
    __name(createPromptBuilder, "createPromptBuilder");
    development = { "persona": "business_consultant", "model": "gpt-4o-mini", "debug_logging": true, "chatbot_enabled": true, "token_budget": { "anonymous": { "max_tokens_per_response": 32e3, "daily_token_budget": 8e4, "session_token_budget": 4e4 }, "engaged": { "max_tokens_per_response": 4e4, "daily_token_budget": 12e4, "session_token_budget": 6e4 }, "verified": { "max_tokens_per_response": 48e3, "daily_token_budget": 16e4, "session_token_budget": 8e4 } } };
    production = { "persona": "business_consultant", "model": "gpt-4o-mini", "debug_logging": false, "chatbot_enabled": true, "token_budget": { "anonymous": { "max_tokens_per_response": 32e3, "daily_token_budget": 8e4, "session_token_budget": 4e4 }, "engaged": { "max_tokens_per_response": 4e4, "daily_token_budget": 12e4, "session_token_budget": 6e4 }, "verified": { "max_tokens_per_response": 48e3, "daily_token_budget": 16e4, "session_token_budget": 8e4 } } };
    envConfigs = {
      development,
      production
    };
    InputValidator = class {
      static {
        __name(this, "InputValidator");
      }
      static HTML_ENTITY_MAP = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#x27;",
        "/": "&#x2F;",
        "`": "&#x60;",
        "=": "&#x3D;"
      };
      static XSS_PATTERNS = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
        /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
        /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
        /<link\b[^<]*>/gi,
        /<meta\b[^<]*>/gi,
        /javascript:/gi,
        /vbscript:/gi,
        /onload\s*=/gi,
        /onclick\s*=/gi,
        /onerror\s*=/gi,
        /onmouseover\s*=/gi,
        /onfocus\s*=/gi,
        /onblur\s*=/gi
      ];
      static SQL_INJECTION_PATTERNS = [
        /(\s|^)(union|select|insert|update|delete|drop|create|alter|exec|execute)\s/gi,
        /(\s|^)(or|and)\s+\d+\s*=\s*\d+/gi,
        /(\s|^)(or|and)\s+['"]\w+['"]?\s*=\s*['"]\w+['"]?/gi,
        /(\s|^)\d+\s*(=|>|<|>=|<=)\s*\d+(\s|$)/gi,
        /['"](\s|;|--|\*|\|)/gi,
        /\b(xp_|sp_)\w+/gi
      ];
      static COMMAND_INJECTION_PATTERNS = [
        /[;&|`$(){}[\]]/gi,
        /\b(cat|ls|pwd|rm|mkdir|rmdir|cp|mv|chmod|chown|ps|kill|wget|curl|nc|netcat)\b/gi,
        /\.\.\//gi,
        /\/etc\/passwd/gi,
        /\/proc\/self\/environ/gi
      ];
      /**
       * Validate data against a schema
       */
      static validate(data, schema) {
        const errors = [];
        const sanitizedData = {};
        for (const [key, rule] of Object.entries(schema)) {
          const value = data[key];
          const fieldResult = this.validateField(key, value, rule);
          if (!fieldResult.valid) {
            errors.push(...fieldResult.errors);
          } else if (fieldResult.sanitizedValue !== void 0) {
            sanitizedData[key] = fieldResult.sanitizedValue;
          }
        }
        for (const key of Object.keys(data)) {
          if (!schema[key]) {
            errors.push(`Unexpected field: ${key}`);
          }
        }
        return {
          valid: errors.length === 0,
          errors,
          sanitizedData: errors.length === 0 ? sanitizedData : void 0
        };
      }
      /**
       * Validate a single field
       */
      static validateField(fieldName, value, rule) {
        const errors = [];
        let sanitizedValue = value;
        if (rule.required && (value === void 0 || value === null || value === "")) {
          errors.push(`${fieldName} is required`);
          return { valid: false, errors };
        }
        if (!rule.required && (value === void 0 || value === null || value === "")) {
          return { valid: true, errors: [], sanitizedValue: value };
        }
        if (rule.type) {
          const typeResult = this.validateType(fieldName, value, rule.type);
          if (!typeResult.valid) {
            errors.push(...typeResult.errors);
          } else {
            sanitizedValue = typeResult.sanitizedValue;
          }
        }
        if (typeof sanitizedValue === "string") {
          if (rule.minLength !== void 0 && sanitizedValue.length < rule.minLength) {
            errors.push(`${fieldName} must be at least ${rule.minLength} characters long`);
          }
          if (rule.maxLength !== void 0 && sanitizedValue.length > rule.maxLength) {
            errors.push(`${fieldName} must be no more than ${rule.maxLength} characters long`);
          }
          if (rule.pattern && !rule.pattern.test(sanitizedValue)) {
            errors.push(`${fieldName} format is invalid`);
          }
          const securityResult = this.validateSecurity(fieldName, sanitizedValue);
          if (!securityResult.valid) {
            errors.push(...securityResult.errors);
          }
          if (rule.sanitize) {
            sanitizedValue = this.sanitizeString(sanitizedValue);
          }
        }
        if (typeof sanitizedValue === "number") {
          if (rule.min !== void 0 && sanitizedValue < rule.min) {
            errors.push(`${fieldName} must be at least ${rule.min}`);
          }
          if (rule.max !== void 0 && sanitizedValue > rule.max) {
            errors.push(`${fieldName} must be no more than ${rule.max}`);
          }
        }
        if (rule.allowedValues && !rule.allowedValues.includes(sanitizedValue)) {
          errors.push(`${fieldName} must be one of: ${rule.allowedValues.join(", ")}`);
        }
        if (rule.custom) {
          const customResult = rule.custom(sanitizedValue);
          if (!customResult.valid) {
            errors.push(customResult.message || `${fieldName} failed custom validation`);
          }
        }
        return {
          valid: errors.length === 0,
          errors,
          sanitizedValue
        };
      }
      /**
       * Validate data type and convert if necessary
       */
      static validateType(fieldName, value, expectedType) {
        const errors = [];
        switch (expectedType) {
          case "string":
            if (typeof value !== "string") {
              errors.push(`${fieldName} must be a string`);
            }
            return { valid: errors.length === 0, errors, sanitizedValue: String(value) };
          case "number":
            const num = Number(value);
            if (isNaN(num)) {
              errors.push(`${fieldName} must be a valid number`);
            }
            return { valid: errors.length === 0, errors, sanitizedValue: num };
          case "boolean":
            if (typeof value === "boolean") {
              return { valid: true, errors: [], sanitizedValue: value };
            }
            if (value === "true" || value === "1" || value === 1) {
              return { valid: true, errors: [], sanitizedValue: true };
            }
            if (value === "false" || value === "0" || value === 0) {
              return { valid: true, errors: [], sanitizedValue: false };
            }
            errors.push(`${fieldName} must be a boolean`);
            return { valid: false, errors };
          case "array":
            if (!Array.isArray(value)) {
              errors.push(`${fieldName} must be an array`);
            }
            return { valid: errors.length === 0, errors, sanitizedValue: value };
          case "object":
            if (typeof value !== "object" || Array.isArray(value) || value === null) {
              errors.push(`${fieldName} must be an object`);
            }
            return { valid: errors.length === 0, errors, sanitizedValue: value };
          case "email":
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (typeof value !== "string" || !emailPattern.test(value)) {
              errors.push(`${fieldName} must be a valid email address`);
            }
            return { valid: errors.length === 0, errors, sanitizedValue: value };
          case "url":
            try {
              new URL(value);
              return { valid: true, errors: [], sanitizedValue: value };
            } catch {
              errors.push(`${fieldName} must be a valid URL`);
              return { valid: false, errors };
            }
          case "uuid":
            const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            if (typeof value !== "string" || !uuidPattern.test(value)) {
              errors.push(`${fieldName} must be a valid UUID`);
            }
            return { valid: errors.length === 0, errors, sanitizedValue: value };
          default:
            return { valid: true, errors: [], sanitizedValue: value };
        }
      }
      /**
       * Validate for security threats
       */
      static validateSecurity(fieldName, value) {
        const errors = [];
        for (const pattern of this.XSS_PATTERNS) {
          if (pattern.test(value)) {
            errors.push(`${fieldName} contains potentially malicious content (XSS)`);
            break;
          }
        }
        for (const pattern of this.SQL_INJECTION_PATTERNS) {
          if (pattern.test(value)) {
            errors.push(`${fieldName} contains potentially malicious content (SQL injection)`);
            break;
          }
        }
        for (const pattern of this.COMMAND_INJECTION_PATTERNS) {
          if (pattern.test(value)) {
            errors.push(`${fieldName} contains potentially malicious content (Command injection)`);
            break;
          }
        }
        return { valid: errors.length === 0, errors };
      }
      /**
       * Sanitize string input
       */
      static sanitizeString(value) {
        let sanitized = value.replace(/[&<>"'`=\/]/g, (s) => this.HTML_ENTITY_MAP[s]);
        sanitized = sanitized.replace(/\0/g, "");
        sanitized = sanitized.replace(/\s+/g, " ").trim();
        return sanitized;
      }
      /**
       * Create validation middleware for API routes
       */
      static createMiddleware(schema) {
        return async (request) => {
          try {
            const contentType = request.headers.get("content-type") || "";
            let data;
            if (contentType.includes("application/json")) {
              data = await request.json();
            } else if (contentType.includes("application/x-www-form-urlencoded")) {
              const formData = await request.formData();
              data = Object.fromEntries(formData.entries());
            } else {
              return {
                valid: false,
                response: new Response(JSON.stringify({
                  error: "Unsupported content type",
                  supportedTypes: ["application/json", "application/x-www-form-urlencoded"]
                }), {
                  status: 400,
                  headers: { "Content-Type": "application/json" }
                })
              };
            }
            const validation = this.validate(data, schema);
            if (!validation.valid) {
              return {
                valid: false,
                response: new Response(JSON.stringify({
                  error: "Validation failed",
                  details: validation.errors,
                  timestamp: (/* @__PURE__ */ new Date()).toISOString()
                }), {
                  status: 400,
                  headers: { "Content-Type": "application/json" }
                })
              };
            }
            return {
              valid: true,
              data: validation.sanitizedData
            };
          } catch (error4) {
            return {
              valid: false,
              response: new Response(JSON.stringify({
                error: "Invalid request data",
                timestamp: (/* @__PURE__ */ new Date()).toISOString()
              }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
              })
            };
          }
        };
      }
      /**
       * Predefined validation schemas for common use cases
       */
      static schemas = {
        chatMessage: {
          message: {
            required: true,
            type: "string",
            minLength: 1,
            maxLength: 4e3,
            sanitize: true
          },
          session_id: {
            required: false,
            type: "uuid"
          },
          conversation_history: {
            required: false,
            type: "array",
            custom: /* @__PURE__ */ __name((value) => {
              if (value.length > 50) {
                return { valid: false, message: "Conversation history too long" };
              }
              return { valid: true };
            }, "custom")
          },
          csrf_token: {
            required: true,
            type: "string",
            minLength: 32,
            maxLength: 64
          }
        },
        userProfile: {
          email: {
            required: false,
            type: "email",
            sanitize: true
          },
          name: {
            required: false,
            type: "string",
            maxLength: 100,
            sanitize: true
          },
          preferences: {
            required: false,
            type: "object"
          }
        },
        emailVerification: {
          email: {
            required: true,
            type: "email",
            sanitize: true
          },
          token: {
            required: true,
            type: "string",
            minLength: 32,
            maxLength: 128
          }
        }
      };
    };
    __vite_import_meta_env__2 = { "ASSETS_PREFIX": void 0, "BASE_URL": "/", "DEV": false, "MODE": "production", "PROD": true, "SITE": void 0, "SSR": true };
    prerender3 = false;
    getCorsHeaders = /* @__PURE__ */ __name((request) => {
      const domainValidator = new DomainValidator();
      const origin = request.headers.get("origin");
      return domainValidator.getCORSHeaders(origin || void 0);
    }, "getCorsHeaders");
    OPTIONS = /* @__PURE__ */ __name(async ({ request }) => {
      const corsHeaders = getCorsHeaders(request);
      return new Response(null, {
        status: 200,
        headers: corsHeaders
      });
    }, "OPTIONS");
    GET3 = /* @__PURE__ */ __name(async ({ request, locals, url }) => {
      try {
        const corsHeaders = getCorsHeaders(request);
        const sessionId = url.searchParams.get("session_id");
        if (!sessionId) {
          return new Response(JSON.stringify({
            error: "Missing session_id parameter"
          }), {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders
            }
          });
        }
        const kv = locals.runtime?.env?.CHATBOT_KV;
        if (!kv) {
          return new Response(JSON.stringify({
            error: "Service temporarily unavailable"
          }), {
            status: 503,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders
            }
          });
        }
        const csrfProtection = new CSRFProtection(kv);
        const token = await csrfProtection.getSessionToken(sessionId);
        return new Response(JSON.stringify({
          csrf_token: token,
          session_id: sessionId,
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          client_script: csrfProtection.generateClientScript(token)
        }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "X-CSRF-Protection": "enabled",
            ...corsHeaders
          }
        });
      } catch (error4) {
        console.error("CSRF token generation error:", error4);
        const corsHeaders = getCorsHeaders(request);
        return new Response(JSON.stringify({
          error: "Failed to generate CSRF token",
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }), {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        });
      }
    }, "GET");
    __name(readDevVarsFromFile, "readDevVarsFromFile");
    __name(getAvailableToolsFromServices, "getAvailableToolsFromServices");
    __name(getEnvVal, "getEnvVal");
    __name(extractBookingDetails, "extractBookingDetails");
    POST2 = /* @__PURE__ */ __name(async ({ request, locals }) => {
      try {
        const domainValidator = new DomainValidator();
        const domainValidation = domainValidator.validateRequest(request);
        if (!domainValidation.valid) {
          const kv2 = locals.runtime?.env?.CHATBOT_KV;
          await domainValidator.logSecurityViolation(domainValidation, request, kv2);
          return domainValidator.createDomainErrorResponse(domainValidation);
        }
        const body = await request.json();
        const validation = InputValidator.validate(body, InputValidator.schemas.chatMessage);
        if (!validation.valid) {
          devLog("Input validation failed:", validation.errors);
          const corsHeaders2 = getCorsHeaders(request);
          return new Response(JSON.stringify({
            error: "Invalid input data",
            details: validation.errors,
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          }), {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders2
            }
          });
        }
        const { message, session_id = crypto.randomUUID(), conversation_history = [] } = validation.sanitizedData;
        devLog("Architecture 2 chat request:", { message, session_id, history_length: conversation_history.length });
        const kv = locals.runtime?.env?.CHATBOT_KV;
        const schedulerKv = locals.runtime?.env?.SCHEDULER_KV || kv;
        let encryptedKv = null;
        if (kv) {
          const encryptionKey = locals.runtime?.env?.KV_ENCRYPTION_KEY || "default-dev-key-change-in-production";
          encryptedKv = new EncryptedKV(kv, encryptionKey);
        }
        if (kv) {
          const csrfProtection = new CSRFProtection(kv);
          const csrfValidation = await csrfProtection.validateRequest(request, session_id);
          if (!csrfValidation.valid) {
            devLog("CSRF validation failed:", csrfValidation.reason);
            return csrfProtection.createCSRFErrorResponse(csrfValidation.reason || "CSRF validation failed");
          }
        }
        if (kv) {
          const rateLimiter = new RateLimiter(kv);
          const clientIP = request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For") || "unknown";
          const quickProfileData = await kv.get(`session:${session_id}`);
          const quickProfile = quickProfileData ? JSON.parse(quickProfileData) : null;
          const userTier = RateLimiter.getUserTier(quickProfile, null);
          const rateLimit = await rateLimiter.checkRateLimit(clientIP, userTier);
          if (!rateLimit.allowed) {
            return rateLimiter.createRateLimitResponse(rateLimit);
          }
          locals.rateLimit = rateLimit;
          locals.rateLimiter = rateLimiter;
        }
        let environment = locals.runtime?.env;
        if (!environment || Object.keys(environment).length === 0) {
          const devVars = await readDevVarsFromFile();
          if (devVars) environment = devVars;
        }
        const serviceArchitecture = createServiceArchitecture(environment);
        await serviceArchitecture.ensureServicesLoaded();
        const profileManager = new ProfileManager(kv);
        const profile3 = await profileManager.getUserProfile(session_id);
        devLog("User profile:", { id: profile3.id, interactions: profile3.interactions, trustScore: profile3.trustScore });
        const envMode = false ? "development" : "production";
        devLog("Env mode:", envMode);
        const envConfig = envConfigs[envMode];
        const tokenBudgetManager = new TokenBudgetManager(kv, envConfig);
        const tokenAllocation = await tokenBudgetManager.calculateTokenAllocation(profile3);
        devLog("Token allocation:", tokenAllocation);
        if (!envConfig.chatbot_enabled) {
          return new Response(JSON.stringify({
            reply: "I'm currently offline for maintenance. Please contact us directly for assistance.",
            chatbot_offline: true
          }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        }
        const promptBuilder = createPromptBuilder("business_consultant", "business_consultation");
        const allServices = serviceArchitecture.getUserFacingServices();
        const servicesList = allServices.map((s) => s.displayName).join(", ");
        const categories = Array.from(new Set(allServices.map((s) => s.businessCategory))).filter((cat) => typeof cat === "string" && cat.trim() !== "");
        const systemPrompt = promptBuilder.buildSystemPrompt(
          servicesList,
          categories.length,
          allServices.length,
          profile3
        );
        const AVAILABLE_TOOLS = getAvailableToolsFromServices(serviceArchitecture, profile3);
        const openaiMessages = [
          {
            role: "system",
            content: systemPrompt
          }
        ];
        if (conversation_history && conversation_history.length > 0) {
          conversation_history.forEach((msg) => {
            openaiMessages.push({
              role: msg.role,
              content: msg.content
            });
          });
        }
        openaiMessages.push({
          role: "user",
          content: message
        });
        devLog("System prompt length:", systemPrompt.length);
        devLog("Available tools count:", AVAILABLE_TOOLS.length);
        const bookingDetails = extractBookingDetails(openaiMessages);
        devLog("Booking details extracted:", bookingDetails);
        if (bookingDetails.ready && bookingDetails.explicitBooking) {
          try {
            devLog("Attempting server-side direct booking...");
            await profileManager.trackServiceUsage(profile3, "schedule_discovery_call", "free", true);
            const result = await executeScheduleCall({
              name: bookingDetails.name,
              email: bookingDetails.email,
              phone: bookingDetails.phone,
              preferred_times: bookingDetails.preferred_times || "flexible",
              timezone: bookingDetails.timezone || "America/Los_Angeles",
              project_details: bookingDetails.project_details || "Not specified"
            }, profile3, profileManager, environment, schedulerKv);
            devLog("Direct booking result:", result);
            if (result?.status === "error") {
              errorLog("Calendar booking error (direct fallback):", result);
            }
            let finalResponseText = "";
            if (result?.status === "meeting_requested" && result.tracking_id) {
              finalResponseText = `Got it \u2014 I\u2019ve sent your request to our team and we\u2019ll confirm the meeting time by email.

\u2022 Name: ${bookingDetails.name}
\u2022 Email: ${bookingDetails.email}
\u2022 Preferred: ${bookingDetails.preferred_times || "Flexible"}
\u2022 Reference: ${result.tracking_id}${result.proposed_time ? `
\u2022 Proposed: ${result.proposed_time}` : ""}${result.meeting_link ? `
\u2022 Meeting: ${result.meeting_link}` : ""}`;
            } else if (result?.status === "validation_error") {
              finalResponseText = `I need a couple details to book: ${result.required_fields?.join(", ")}.`;
            } else if (result?.status === "error") {
              finalResponseText = `I had trouble sending the request. Please email ${result.fallback_email || "manny@mannyknows.com"} and we\u2019ll confirm manually.`;
            } else {
              finalResponseText = `I had trouble booking that just now. Please share a time window and I\u2019ll try again.`;
            }
            return new Response(JSON.stringify({
              reply: finalResponseText,
              finalResponse: finalResponseText,
              session_id
            }), { status: 200, headers: { "Content-Type": "application/json" } });
          } catch (e) {
            devLog("Direct booking fallback failed:", e);
          }
        }
        const apiKey = getEnvVal("OPENAI_API_KEY", environment);
        const SAFE_MODEL_COMPLETION_CAP = 12e3;
        const maxTokensThisCall = Math.max(256, Math.min(SAFE_MODEL_COMPLETION_CAP, tokenAllocation.maxTokensForResponse));
        const requestBody = {
          model: envConfig.model,
          messages: openaiMessages,
          max_completion_tokens: maxTokensThisCall,
          tools: AVAILABLE_TOOLS,
          tool_choice: "auto"
        };
        const baseUrl = (getEnvVal("OPENAI_BASE_URL", environment) || "https://api.openai.com").replace(/\/+$/, "");
        const apiHeaderName = getEnvVal("OPENAI_AUTH_HEADER", environment) || "Authorization";
        const apiHeaderScheme = getEnvVal("OPENAI_AUTH_SCHEME", environment) || "Bearer";
        const headersInit = {
          "Content-Type": "application/json"
        };
        headersInit[apiHeaderName] = `${apiHeaderScheme} ${apiKey}`;
        try {
          const extra = getEnvVal("OPENAI_EXTRA_HEADERS", environment);
          if (extra) {
            const parsed = JSON.parse(extra);
            if (parsed && typeof parsed === "object") {
              for (const [k, v] of Object.entries(parsed)) {
                if (typeof v === "string") headersInit[k] = v;
              }
            }
          }
        } catch {
        }
        const openaiResponse = await fetch(`${baseUrl}/v1/chat/completions`, {
          method: "POST",
          headers: headersInit,
          body: JSON.stringify(requestBody)
        });
        if (!openaiResponse.ok) {
          const errorText = await openaiResponse.text();
          devLog("OpenAI API error:", `${openaiResponse.status} - ${errorText}`);
          if (openaiResponse.status === 401) {
            const fallbackText = `I'm temporarily offline because my AI key is invalid or missing. Please check OPENAI_API_KEY in your environment and try again.`;
            return new Response(JSON.stringify({
              reply: fallbackText,
              finalResponse: fallbackText,
              session_id
            }), { status: 200, headers: { "Content-Type": "application/json" } });
          }
          throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorText}`);
        }
        const data = await openaiResponse.json();
        devLog("OpenAI response:", data);
        const choice = data.choices[0];
        let finalResponse = "";
        if (choice.message.tool_calls) {
          const toolResults = [];
          for (const toolCall of choice.message.tool_calls) {
            const functionName = toolCall.function.name;
            const functionArgs = JSON.parse(toolCall.function.arguments);
            devLog("Executing function:", `${functionName} with ${JSON.stringify(functionArgs)}`);
            let toolResult = null;
            switch (functionName) {
              case "analyze_website":
                toolResult = await executeWebsiteAnalysis(functionArgs.url, session_id, kv, profile3, profileManager, serviceArchitecture);
                break;
              case "show_available_services":
                toolResult = await executeShowServices(profile3, profileManager, serviceArchitecture);
                break;
              case "get_seo_tips":
                toolResult = await executeGetSeoTips(functionArgs.topic, profile3, profileManager);
                break;
              case "check_domain_status":
                toolResult = await executeCheckDomain(functionArgs.domain, profile3, profileManager);
                break;
              case "get_industry_insights":
                toolResult = await executeIndustryInsights(functionArgs.industry, profile3, profileManager, serviceArchitecture);
                break;
              case "schedule_discovery_call":
                toolResult = await executeScheduleCall(functionArgs, profile3, profileManager, environment, schedulerKv);
                break;
              case "lookup_existing_meetings":
                toolResult = await executeLookupExistingMeetings(functionArgs, profile3, profileManager, environment, schedulerKv);
                break;
              case "manage_meeting":
                toolResult = await executeManageMeeting(functionArgs, profile3, profileManager, environment, schedulerKv);
                break;
              default:
                toolResult = {
                  error: `Function ${functionName} not implemented`,
                  message: `Sorry, ${functionName} is not available yet.`
                };
            }
            toolResults.push({
              tool_call_id: toolCall.id,
              result: toolResult,
              name: functionName
            });
          }
          const toolMessages = toolResults.map((result) => {
            let resultContent = JSON.stringify(result.result);
            if (resultContent.length > 4e3) {
              const truncatedResult = {
                ...result.result,
                truncated: true,
                originalSize: resultContent.length
              };
              resultContent = JSON.stringify(truncatedResult).substring(0, 4e3) + "...}";
            }
            return {
              role: "tool",
              content: resultContent,
              tool_call_id: result.tool_call_id,
              name: result.name
            };
          });
          const followUpRequestBody = {
            model: envConfig.model,
            messages: [
              ...openaiMessages,
              { role: "assistant", content: choice.message.content || "", tool_calls: choice.message.tool_calls },
              ...toolMessages
            ],
            max_completion_tokens: Math.max(256, Math.min(2e3, maxTokensThisCall))
          };
          const followUpResponse = await fetch(`${baseUrl}/v1/chat/completions`, {
            method: "POST",
            headers: headersInit,
            body: JSON.stringify(followUpRequestBody)
          });
          if (!followUpResponse.ok) {
            const errorData = await followUpResponse.text();
            devLog("Follow-up OpenAI API error:", `${followUpResponse.status} - ${errorData}`);
            devLog("Follow-up request body:", JSON.stringify(followUpRequestBody, null, 2));
            throw new Error(`OpenAI API error: ${followUpResponse.status}`);
          }
          const followUpData = await followUpResponse.json();
          finalResponse = followUpData.choices[0].message.content || "I apologize, but I'm having trouble processing that request right now.";
          const scheduleResult = toolResults.find((t) => t.name === "schedule_discovery_call")?.result;
          if (scheduleResult?.status === "meeting_requested" && scheduleResult?.tracking_id) {
            const extras = `

Reference: ${scheduleResult.tracking_id}` + (scheduleResult.proposed_time ? `
Proposed: ${scheduleResult.proposed_time}` : "") + (scheduleResult.meeting_link ? `
Meeting: ${scheduleResult.meeting_link}` : "");
            if (!finalResponse.includes(scheduleResult.tracking_id)) {
              finalResponse += extras;
            }
          }
        } else {
          finalResponse = choice.message.content || "";
          if (data.choices[0].finish_reason === "length") {
            if (!finalResponse.trim()) {
              finalResponse = "I was going to give you a detailed response, but it got cut off. Let me try again with a shorter answer. Could you please repeat your question?";
            } else {
              finalResponse += "\n\n(Note: My response was cut short - feel free to ask for more details!)";
            }
          }
          if (!finalResponse.trim()) {
            finalResponse = "I understand your question, but I'm having trouble formulating a complete response right now. Could you try rephrasing your question?";
          }
        }
        const promptTokens = data.usage?.prompt_tokens || 0;
        const completionTokens = data.usage?.completion_tokens || 0;
        await tokenBudgetManager.trackTokenUsage(profile3.id, promptTokens, completionTokens);
        await profileManager.trackInteraction(profile3, "message_sent", {
          messageLength: message.length,
          responseLength: finalResponse.length,
          toolsUsed: choice.message.tool_calls?.length || 0,
          tokensUsed: promptTokens + completionTokens,
          userTier: tokenAllocation.userTier
        });
        if (tokenAllocation.budgetWarning) {
          finalResponse += `

\u{1F4A1} ${tokenAllocation.budgetWarning}`;
        }
        devLog("Final response being sent:", { finalResponse, length: finalResponse.length });
        const usageSummary = await tokenBudgetManager.getUsageSummary(profile3);
        const corsHeaders = getCorsHeaders(request);
        return new Response(JSON.stringify({
          reply: finalResponse,
          finalResponse,
          // For frontend compatibility
          session_id,
          profile_summary: {
            interactions: profile3.interactions,
            trustScore: profile3.trustScore,
            servicesUsed: profile3.freeServicesUsed.length + profile3.premiumServicesUsed.length,
            tier: usageSummary.tier,
            usage: {
              daily: usageSummary.dailyUsage,
              session: usageSummary.sessionUsage
            }
          }
        }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
            // Add rate limit headers if available
            ...locals.rateLimit && locals.rateLimiter ? locals.rateLimiter.getRateLimitHeaders(locals.rateLimit) : {}
          }
        });
      } catch (error4) {
        const corsHeaders = getCorsHeaders(request);
        return new Response(JSON.stringify({
          error: "Failed to process your request",
          details: error4 instanceof Error ? error4.message : "Unknown error"
        }), {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        });
      }
    }, "POST");
    __name(executeWebsiteAnalysis, "executeWebsiteAnalysis");
    __name(executeShowServices, "executeShowServices");
    __name(executeGetSeoTips, "executeGetSeoTips");
    __name(executeCheckDomain, "executeCheckDomain");
    __name(executeIndustryInsights, "executeIndustryInsights");
    __name(executeScheduleCall, "executeScheduleCall");
    __name(executeLookupExistingMeetings, "executeLookupExistingMeetings");
    __name(executeManageMeeting, "executeManageMeeting");
    __name(generateVerificationEmail, "generateVerificationEmail");
    _page4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
      __proto__: null,
      GET: GET3,
      OPTIONS,
      POST: POST2,
      prerender: prerender3
    }, Symbol.toStringTag, { value: "Module" }));
    page4 = /* @__PURE__ */ __name(() => _page4, "page");
  }
});

// dist/_worker.js/pages/api/kv-analysis.astro.mjs
var kv_analysis_astro_exports = {};
__export(kv_analysis_astro_exports, {
  page: () => page5,
  renderers: () => renderers
});
var prerender4, GET4, _page5, page5;
var init_kv_analysis_astro = __esm({
  "dist/_worker.js/pages/api/kv-analysis.astro.mjs"() {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_renderers();
    globalThis.process ??= {};
    globalThis.process.env ??= {};
    prerender4 = false;
    GET4 = /* @__PURE__ */ __name(async ({ request, locals, url }) => {
      try {
        const authHeader = request.headers.get("authorization");
        const adminKey = locals.runtime?.env?.ADMIN_API_KEY;
        if (!authHeader || !adminKey || authHeader !== `Bearer ${adminKey}`) {
          return new Response(JSON.stringify({
            error: "Unauthorized - Admin access required"
          }), {
            status: 401,
            headers: { "Content-Type": "application/json" }
          });
        }
        const kv = locals.runtime?.env?.CHATBOT_KV;
        if (!kv) {
          return new Response(JSON.stringify({
            error: "KV storage not available"
          }), {
            status: 503,
            headers: { "Content-Type": "application/json" }
          });
        }
        const sampleSize = parseInt(url.searchParams.get("sample") || "20");
        const showValues = url.searchParams.get("show_values") === "true";
        const allKeys = await kv.list();
        const keyPatterns = {
          sessions: [],
          userProfiles: [],
          auth: [],
          tokens: [],
          verification: [],
          payment: [],
          personal: [],
          rateLimits: [],
          security: [],
          other: []
        };
        const sensitivePatterns = [
          { name: "sessions", regex: /^session:.*/ },
          { name: "userProfiles", regex: /^user:.*:profile/ },
          { name: "auth", regex: /^auth:.*/ },
          { name: "tokens", regex: /^token:.*/ },
          { name: "verification", regex: /^verification:.*/ },
          { name: "payment", regex: /^payment:.*/ },
          { name: "personal", regex: /^personal:.*/ }
        ];
        for (const keyInfo of allKeys.keys?.slice(0, 100) || []) {
          const key = keyInfo.name;
          let categorized = false;
          for (const pattern of sensitivePatterns) {
            if (pattern.regex.test(key)) {
              keyPatterns[pattern.name].push({
                key,
                metadata: keyInfo.metadata,
                expiration: keyInfo.expiration
              });
              categorized = true;
              break;
            }
          }
          if (!categorized) {
            if (key.startsWith("rate_limit:")) {
              keyPatterns.rateLimits.push({ key, metadata: keyInfo.metadata });
            } else if (key.startsWith("security_log:") || key.startsWith("csrf:")) {
              keyPatterns.security.push({ key, metadata: keyInfo.metadata });
            } else {
              keyPatterns.other.push({ key, metadata: keyInfo.metadata });
            }
          }
        }
        const sampleData = {};
        if (showValues && sampleSize <= 5) {
          for (const [category, keys] of Object.entries(keyPatterns)) {
            if (keys.length > 0 && ["sessions", "userProfiles"].includes(category)) {
              const sampleKey = keys[0].key;
              try {
                const value = await kv.get(sampleKey);
                let displayValue = value;
                if (typeof value === "string" && value.length > 200) {
                  displayValue = value.substring(0, 200) + "...[truncated]";
                }
                if (typeof displayValue === "string") {
                  displayValue = displayValue.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "***@***.***").replace(/"token":\s*"[^"]+"/g, '"token": "***"').replace(/"apiKey":\s*"[^"]+"/g, '"apiKey": "***"').replace(/sk-[a-zA-Z0-9-]+/g, "sk-***");
                }
                sampleData[category] = {
                  sampleKey,
                  sampleValue: displayValue,
                  valueType: typeof value
                };
              } catch (error4) {
                sampleData[category] = { error: "Failed to retrieve value" };
              }
            }
          }
        }
        const stats = {
          totalKeys: allKeys.keys?.length || 0,
          sensitiveKeyBreakdown: Object.fromEntries(
            Object.entries(keyPatterns).map(([category, keys]) => [category, keys.length])
          ),
          totalSensitiveKeys: Object.values(keyPatterns).slice(0, 7).reduce((sum, keys) => sum + keys.length, 0)
        };
        return new Response(JSON.stringify({
          stats,
          keyPatterns: Object.fromEntries(
            Object.entries(keyPatterns).map(([category, keys]) => [
              category,
              keys.slice(0, sampleSize).map((k) => ({ key: k.key, metadata: k.metadata }))
            ])
          ),
          sampleData: showValues ? sampleData : "Use ?show_values=true&sample=3 to see sample values",
          recommendations: {
            immediatelyEncrypt: ["sessions", "userProfiles", "auth", "tokens", "verification"],
            considerEncrypting: ["personal", "payment"],
            doNotEncrypt: ["rateLimits", "security", "other"]
          },
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      } catch (error4) {
        console.error("KV analysis error:", error4);
        return new Response(JSON.stringify({
          error: "Failed to analyze KV data",
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }, "GET");
    _page5 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
      __proto__: null,
      GET: GET4,
      prerender: prerender4
    }, Symbol.toStringTag, { value: "Module" }));
    page5 = /* @__PURE__ */ __name(() => _page5, "page");
  }
});

// dist/_worker.js/pages/api/security-status.astro.mjs
var security_status_astro_exports = {};
__export(security_status_astro_exports, {
  page: () => page6,
  renderers: () => renderers
});
var prerender5, GET5, POST3, _page6, page6;
var init_security_status_astro = __esm({
  "dist/_worker.js/pages/api/security-status.astro.mjs"() {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_kvEncryption_B8t_dpS8();
    init_renderers();
    globalThis.process ??= {};
    globalThis.process.env ??= {};
    prerender5 = false;
    GET5 = /* @__PURE__ */ __name(async ({ request, locals, url }) => {
      try {
        const authHeader = request.headers.get("authorization");
        const adminKey = locals.runtime?.env?.ADMIN_API_KEY;
        if (!authHeader || !adminKey || authHeader !== `Bearer ${adminKey}`) {
          return new Response(JSON.stringify({
            error: "Unauthorized - Admin access required"
          }), {
            status: 401,
            headers: { "Content-Type": "application/json" }
          });
        }
        const kv = locals.runtime?.env?.CHATBOT_KV;
        if (!kv) {
          return new Response(JSON.stringify({
            error: "KV storage not available"
          }), {
            status: 503,
            headers: { "Content-Type": "application/json" }
          });
        }
        const encryptionKey = locals.runtime?.env?.KV_ENCRYPTION_KEY || "default-dev-key-change-in-production";
        const encryptedKv = new EncryptedKV(kv, encryptionKey);
        const csrfProtection = new CSRFProtection(kv);
        const rateLimiter = new RateLimiter(kv);
        const domainValidator = new DomainValidator();
        const securityStatus = {
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          version: "1.0.0",
          // Encryption status
          encryption: await encryptedKv.getEncryptionStats(),
          // Domain validation status
          domainValidation: {
            enabled: true,
            allowedDomains: domainValidator.getAllowedDomains(),
            developmentMode: domainValidator.isDevMode()
          },
          // CSRF protection status
          csrfProtection: {
            enabled: true,
            enforceHTTPS: true,
            tokenTimeout: 36e5
            // 1 hour
          },
          // Rate limiting status
          rateLimiting: {
            enabled: true,
            tiers: {
              anonymous: { requestsPerMinute: 30 },
              verified: { requestsPerMinute: 60 },
              premium: { requestsPerMinute: 120 },
              admin: { requestsPerMinute: 1e3 }
            }
          },
          // Input validation status
          inputValidation: {
            enabled: true,
            sanitizationEnabled: true,
            xssProtection: true,
            sqlInjectionProtection: true,
            commandInjectionProtection: true
          },
          // Environment security
          environment: {
            nodeEnv: "production",
            httpsEnforced: !domainValidator.isDevMode(),
            environmentVariablesSecure: {
              encryptionKey: !!locals.runtime?.env?.KV_ENCRYPTION_KEY,
              adminApiKey: !!locals.runtime?.env?.ADMIN_API_KEY,
              openaiApiKey: !!locals.runtime?.env?.OPENAI_API_KEY
            }
          }
        };
        const recommendations = [];
        if (securityStatus.encryption.encryptionCoverage < 100) {
          recommendations.push({
            type: "encryption",
            priority: "high",
            message: `${securityStatus.encryption.unencryptedSensitiveKeys} sensitive keys are not encrypted`
          });
        }
        if (encryptionKey === "default-dev-key-change-in-production") {
          recommendations.push({
            type: "encryption",
            priority: "critical",
            message: "Using default encryption key - change in production"
          });
        }
        if (domainValidator.isDevMode()) {
          recommendations.push({
            type: "environment",
            priority: "medium",
            message: "Running in development mode with relaxed security"
          });
        }
        return new Response(JSON.stringify({
          status: "operational",
          security: securityStatus,
          recommendations,
          summary: {
            totalSecurityLayers: 6,
            activeSecurityLayers: 6,
            securityScore: Math.round(
              (securityStatus.encryption.encryptionCoverage + (recommendations.filter((r2) => r2.priority === "critical").length === 0 ? 100 : 50) + (domainValidator.isDevMode() ? 75 : 100)) / 3
            )
          }
        }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate"
          }
        });
      } catch (error4) {
        console.error("Security status error:", error4);
        return new Response(JSON.stringify({
          error: "Failed to retrieve security status",
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }, "GET");
    POST3 = /* @__PURE__ */ __name(async ({ request, locals }) => {
      try {
        const authHeader = request.headers.get("authorization");
        const adminKey = locals.runtime?.env?.ADMIN_API_KEY;
        if (!authHeader || !adminKey || authHeader !== `Bearer ${adminKey}`) {
          return new Response(JSON.stringify({
            error: "Unauthorized - Admin access required"
          }), {
            status: 401,
            headers: { "Content-Type": "application/json" }
          });
        }
        const body = await request.json();
        const { action, parameters } = body;
        const kv = locals.runtime?.env?.CHATBOT_KV;
        if (!kv) {
          return new Response(JSON.stringify({
            error: "KV storage not available"
          }), {
            status: 503,
            headers: { "Content-Type": "application/json" }
          });
        }
        const encryptionKey = locals.runtime?.env?.KV_ENCRYPTION_KEY || "default-dev-key-change-in-production";
        const encryptedKv = new EncryptedKV(kv, encryptionKey);
        let result;
        switch (action) {
          case "migrate_encryption":
            result = await encryptedKv.migrateToEncryption(
              parameters?.keyPattern ? new RegExp(parameters.keyPattern) : void 0
            );
            break;
          case "backup_data":
            result = await encryptedKv.backup(
              parameters?.keyPattern ? new RegExp(parameters.keyPattern) : void 0
            );
            break;
          case "encryption_stats":
            result = await encryptedKv.getEncryptionStats();
            break;
          default:
            return new Response(JSON.stringify({
              error: "Unknown action",
              availableActions: ["migrate_encryption", "backup_data", "encryption_stats"]
            }), {
              status: 400,
              headers: { "Content-Type": "application/json" }
            });
        }
        return new Response(JSON.stringify({
          action,
          result,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      } catch (error4) {
        console.error("Security action error:", error4);
        return new Response(JSON.stringify({
          error: "Security action failed",
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }, "POST");
    _page6 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
      __proto__: null,
      GET: GET5,
      POST: POST3,
      prerender: prerender5
    }, Symbol.toStringTag, { value: "Module" }));
    page6 = /* @__PURE__ */ __name(() => _page6, "page");
  }
});

// dist/_worker.js/pages/api/verify-meeting-action.astro.mjs
var verify_meeting_action_astro_exports = {};
__export(verify_meeting_action_astro_exports, {
  page: () => page7,
  renderers: () => renderers
});
async function sendOwnerNotification(meeting, actionType, pendingData, environment) {
  try {
    const resendApiKey = environment?.RESEND_API_KEY;
    const ownerEmail = environment?.OWNER_EMAIL || "showyouhow83@gmail.com";
    const resendFrom = environment?.RESEND_FROM || "MannyKnows <noreply@mannyknows.com>";
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not available for owner notification");
      return;
    }
    const actionDetails = actionType === "cancel" ? `<strong>Cancelled</strong> by ${meeting.name}` : `<strong>Reschedule requested</strong> by ${meeting.name}<br>New preferred times: ${pendingData.newPreferredTimes || "To be discussed"}`;
    const htmlBody = `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Meeting ${actionType === "cancel" ? "Cancellation" : "Reschedule Request"}</title>
        <style>
          body{margin:0;padding:0;background:#fafafa;color:#18181b;font-family:-apple-system,BlinkMacSystemFont,"Inter",sans-serif;line-height:1.6}
          .container{max-width:680px;margin:40px auto;background:#ffffff;border:1px solid #e4e4e7;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05)}
          .header{padding:32px 40px;background:linear-gradient(135deg,#ef4444 0%,#dc2626 100%);color:#ffffff}
          .brand{font-weight:700;font-size:28px;letter-spacing:-0.025em}
          .subtitle{font-size:16px;margin-top:6px;font-weight:500;opacity:0.95}
          .content{padding:40px 40px 32px}
          .action{background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:20px;margin:20px 0;color:#dc2626}
          .details{background:#f4f4f5;border-radius:12px;padding:20px;margin:20px 0}
          .label{font-weight:600;color:#71717a;display:block;margin-bottom:4px}
          .value{color:#18181b;margin-bottom:12px}
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="brand">MK</div>
            <div class="subtitle">Meeting ${actionType === "cancel" ? "Cancellation" : "Reschedule Request"}</div>
          </div>
          <div class="content">
            <div class="action">
              ${actionDetails}
            </div>
            
            <div class="details">
              <div class="label">Meeting Details</div>
              <div class="value"><strong>Name:</strong> ${meeting.name}</div>
              <div class="value"><strong>Email:</strong> ${meeting.email}</div>
              <div class="value"><strong>Phone:</strong> ${meeting.phone || "Not provided"}</div>
              <div class="value"><strong>Original Time:</strong> ${meeting.proposed_time}</div>
              <div class="value"><strong>Reference:</strong> ${meeting.id}</div>
              ${pendingData.reason ? `<div class="value"><strong>Reason:</strong> ${pendingData.reason}</div>` : ""}
            </div>
            
            <p><strong>Action Required:</strong></p>
            <p>${actionType === "cancel" ? "The meeting has been cancelled. No further action needed unless you want to follow up with the client." : "Please respond to the client within 24 hours with new time options."}</p>
          </div>
        </div>
      </body>
      </html>
    `;
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: resendFrom,
        to: [ownerEmail],
        subject: `Meeting ${actionType === "cancel" ? "Cancelled" : "Reschedule Request"}: ${meeting.name}`,
        html: htmlBody
      })
    });
    if (!response.ok) {
      throw new Error(`Email sending failed: ${response.status}`);
    }
  } catch (error4) {
    console.error("Error sending owner notification:", error4);
  }
}
var prerender6, GET6, _page7, page7;
var init_verify_meeting_action_astro = __esm({
  "dist/_worker.js/pages/api/verify-meeting-action.astro.mjs"() {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_renderers();
    globalThis.process ??= {};
    globalThis.process.env ??= {};
    prerender6 = false;
    GET6 = /* @__PURE__ */ __name(async ({ url, request, locals }) => {
      try {
        const params = new URL(request.url).searchParams;
        const token = params.get("token");
        const action = params.get("action");
        if (!token || !action) {
          return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invalid Verification Link</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 40px; text-align: center; color: #18181b; }
            .container { max-width: 600px; margin: 0 auto; }
            .error { color: #ef4444; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="error">Invalid Verification Link</h1>
            <p>This verification link is invalid or malformed. Please request a new verification email.</p>
          </div>
        </body>
        </html>
      `, {
            status: 400,
            headers: { "Content-Type": "text/html; charset=utf-8" }
          });
        }
        const kv = locals.runtime?.env?.SCHEDULER_KV;
        const environment = locals.runtime?.env;
        if (!kv) {
          throw new Error("KV binding not available");
        }
        const pendingActionKey = `verify:${token}`;
        const pendingDataRaw = await kv.get(pendingActionKey);
        if (!pendingDataRaw) {
          return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Verification Link Expired</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 40px; text-align: center; color: #18181b; }
            .container { max-width: 600px; margin: 0 auto; }
            .warning { color: #f59e0b; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="warning">Verification Link Expired</h1>
            <p>This verification link has expired or has already been used. Please request a new verification email if you still need to make changes to your meeting.</p>
          </div>
        </body>
        </html>
      `, {
            status: 410,
            headers: { "Content-Type": "text/html; charset=utf-8" }
          });
        }
        const pendingData = JSON.parse(pendingDataRaw);
        if (pendingData.action !== action) {
          return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Action Mismatch</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 40px; text-align: center; color: #18181b; }
            .container { max-width: 600px; margin: 0 auto; }
            .error { color: #ef4444; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="error">Action Mismatch</h1>
            <p>This verification link doesn't match the requested action. Please use the correct verification link from your email.</p>
          </div>
        </body>
        </html>
      `, {
            status: 400,
            headers: { "Content-Type": "text/html; charset=utf-8" }
          });
        }
        const meetingKey = pendingData.meetingKey || `meetreq:${pendingData.trackingId}`;
        const meetingDataRaw = await kv.get(meetingKey);
        if (!meetingDataRaw) {
          return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Meeting Not Found</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 40px; text-align: center; color: #18181b; }
            .container { max-width: 600px; margin: 0 auto; }
            .warning { color: #f59e0b; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="warning">Meeting Not Found</h1>
            <p>The meeting associated with this verification link could not be found. It may have already been processed or cancelled.</p>
          </div>
        </body>
        </html>
      `, {
            status: 404,
            headers: { "Content-Type": "text/html; charset=utf-8" }
          });
        }
        const meeting = JSON.parse(meetingDataRaw);
        let resultMessage = "";
        let actionTitle = "";
        if (action === "cancel") {
          meeting.status = "cancelled";
          meeting.cancelledAt = Date.now();
          meeting.cancellationReason = pendingData.reason || "Cancelled by user";
          await kv.put(meetingKey, JSON.stringify(meeting));
          actionTitle = "Meeting Cancelled";
          resultMessage = `Your meeting scheduled for ${meeting.proposed_time} has been successfully cancelled.`;
          await sendOwnerNotification(meeting, "cancelled", pendingData, environment);
        } else if (action === "reschedule") {
          meeting.status = "reschedule_requested";
          meeting.rescheduleRequestedAt = Date.now();
          meeting.newPreferredTimes = pendingData.newPreferredTimes;
          meeting.rescheduleReason = pendingData.reason || "Reschedule requested by user";
          await kv.put(meetingKey, JSON.stringify(meeting));
          actionTitle = "Reschedule Request Submitted";
          resultMessage = `Your reschedule request for the meeting originally scheduled for ${meeting.proposed_time} has been submitted. Our team will contact you within 24 hours with new time options.`;
          await sendOwnerNotification(meeting, "reschedule", pendingData, environment);
        }
        await kv.delete(pendingActionKey);
        return new Response(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${actionTitle} - MannyKnows</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, sans-serif; 
            margin: 0; 
            padding: 40px 20px; 
            background: #fafafa; 
            color: #18181b; 
            line-height: 1.6;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 16px; 
            padding: 40px; 
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
          }
          .success { color: #10b981; display: flex; align-items: center; gap: 8px; }
          .checkmark { 
            display: inline-block; 
            width: 24px; 
            height: 24px; 
            background: #10b981; 
            border-radius: 50%; 
            position: relative;
          }
          .checkmark::after {
            content: '';
            position: absolute;
            left: 8px;
            top: 4px;
            width: 6px;
            height: 12px;
            border: solid white;
            border-width: 0 2px 2px 0;
            transform: rotate(45deg);
          }
          .brand { 
            background: linear-gradient(135deg, #10d1ff 0%, #ff4faa 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-weight: 700;
            font-size: 24px;
            margin-bottom: 20px;
          }
          .details {
            background: #f4f4f5;
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
          }
          .detail-item {
            margin: 8px 0;
          }
          .label {
            font-weight: 600;
            color: #71717a;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="brand">MK</div>
          <h1 class="success">
            <span class="checkmark"></span>
            ${actionTitle}
          </h1>
          <p>${resultMessage}</p>
          
          <div class="details">
            <div class="detail-item">
              <span class="label">Reference:</span> ${meeting.id}
            </div>
            <div class="detail-item">
              <span class="label">Contact:</span> ${meeting.name} (${meeting.email})
            </div>
            ${action === "reschedule" ? `
              <div class="detail-item">
                <span class="label">New Preferred Times:</span> ${pendingData.newPreferredTimes || "To be discussed"}
              </div>
            ` : ""}
          </div>
          
          <p><strong>What happens next?</strong></p>
          <p>A confirmation email has been sent to our team. ${action === "reschedule" ? "We will contact you within 24 hours with new time options." : "Your cancellation has been processed."}</p>
          
          <p>If you have any questions, please contact us at <a href="mailto:showyouhow83@gmail.com">showyouhow83@gmail.com</a></p>
        </div>
      </body>
      </html>
    `, {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8" }
        });
      } catch (error4) {
        console.error("Error processing meeting verification:", error4);
        return new Response(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Verification Error</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 40px; text-align: center; color: #18181b; }
          .container { max-width: 600px; margin: 0 auto; }
          .error { color: #ef4444; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 class="error">Verification Error</h1>
          <p>There was an error processing your verification. Please contact support at showyouhow83@gmail.com if this issue persists.</p>
        </div>
      </body>
      </html>
    `, {
          status: 500,
          headers: { "Content-Type": "text/html; charset=utf-8" }
        });
      }
    }, "GET");
    __name(sendOwnerNotification, "sendOwnerNotification");
    _page7 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
      __proto__: null,
      GET: GET6,
      prerender: prerender6
    }, Symbol.toStringTag, { value: "Module" }));
    page7 = /* @__PURE__ */ __name(() => _page7, "page");
  }
});

// dist/_worker.js/pages/index.astro.mjs
var index_astro_exports = {};
__export(index_astro_exports, {
  page: () => page8,
  renderers: () => renderers
});
var $$Astro$82, $$HeroSection, $$Astro$72, $$Servicecard, $$Astro$62, $$Section, $$Astro$52, $$Container, $$Astro$42, $$SectionHeader, $$Servicessection, $$Astro$32, $$Reviewcard, $$Astro$22, $$StatsCard, $$ReviewsSection, $$Astro$12, $$PageSection, $$Astro3, $$Processsectionalt, $$Index, $$file2, $$url2, _page8, page8;
var init_index_astro = __esm({
  "dist/_worker.js/pages/index.astro.mjs"() {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_server_BRKsKzpO();
    init_ChatBox_BTFFVlFh();
    init_renderers();
    globalThis.process ??= {};
    globalThis.process.env ??= {};
    $$Astro$82 = createAstro();
    $$HeroSection = createComponent(($$result, $$props, $$slots) => {
      const Astro2 = $$result.createAstro($$Astro$82, $$props, $$slots);
      Astro2.self = $$HeroSection;
      const { title: title2, highlightedText, subtitle, className = "" } = Astro2.props;
      return renderTemplate`${maybeRenderHead()}<section id="hero"${addAttribute(`py-6 text-center min-h-[calc(45vh+50px)] flex items-center apple-gradient-container ${className}`, "class")} data-astro-cid-7nmnspah> <div class="max-w-[1440px] mx-auto px-2" data-astro-cid-7nmnspah> <div class="max-w-16xl mx-auto" data-astro-cid-7nmnspah> <h1 class="sf-bold text-4xl md:text-6xl lg:text-7xl mb-6 apple-headline" data-astro-cid-7nmnspah> ${title2} <span class="apple-gradient-text" data-colorful-title data-astro-cid-7nmnspah>${highlightedText}</span> exponentially with AI
</h1> <p class="sf-regular text-xl mb-10 text-text-light-secondary dark:text-text-dark-secondary apple-body-text max-w-3xl mx-auto" data-astro-cid-7nmnspah> ${subtitle} </p> </div> </div> </section> `;
    }, "/Volumes/MannyKnows/MK/MannyKnows/src/components/sections/HeroSection.astro", void 0);
    $$Astro$72 = createAstro();
    $$Servicecard = createComponent(($$result, $$props, $$slots) => {
      const Astro2 = $$result.createAstro($$Astro$72, $$props, $$slots);
      Astro2.self = $$Servicecard;
      const {
        title: title2,
        description,
        icon,
        tags,
        variant,
        pixelColors,
        className = ""
      } = Astro2.props;
      const variantStyles = {
        indigo: {
          container: "group backdrop-blur-lg border rounded-xl p-8 text-center transition-all duration-300 relative overflow-hidden",
          containerStyle: "background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(99, 102, 241, 0.08)); border-color: rgba(99, 102, 241, 0.4); box-shadow: 0 4px 20px rgba(99, 102, 241, 0.2), 0 1px 3px rgba(99, 102, 241, 0.1);",
          icon: "w-16 h-16 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-2xl flex items-center justify-center transition-transform duration-300",
          text: "text-indigo-400"
        },
        green: {
          container: "group backdrop-blur-lg border rounded-xl p-8 text-center transition-all duration-300 relative overflow-hidden",
          containerStyle: "background: linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.08)); border-color: rgba(34, 197, 94, 0.4); box-shadow: 0 4px 20px rgba(34, 197, 94, 0.2), 0 1px 3px rgba(34, 197, 94, 0.1);",
          icon: "w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center transition-transform duration-300",
          text: "text-green-400"
        },
        blue: {
          container: "group backdrop-blur-lg border rounded-xl p-8 text-center transition-all duration-300 relative overflow-hidden",
          containerStyle: "background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.08)); border-color: rgba(59, 130, 246, 0.4); box-shadow: 0 4px 20px rgba(59, 130, 246, 0.2), 0 1px 3px rgba(59, 130, 246, 0.1);",
          icon: "w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center transition-transform duration-300",
          text: "text-blue-400"
        },
        orange: {
          container: "group backdrop-blur-lg border rounded-xl p-8 text-center transition-all duration-300 relative overflow-hidden",
          containerStyle: "background: linear-gradient(135deg, rgba(249, 115, 22, 0.15), rgba(249, 115, 22, 0.08)); border-color: rgba(249, 115, 22, 0.4); box-shadow: 0 4px 20px rgba(249, 115, 22, 0.2), 0 1px 3px rgba(249, 115, 22, 0.1);",
          icon: "w-16 h-16 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-2xl flex items-center justify-center transition-transform duration-300",
          text: "text-orange-400"
        },
        purple: {
          container: "group backdrop-blur-lg border rounded-xl p-8 text-center transition-all duration-300 relative overflow-hidden",
          containerStyle: "background: linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(168, 85, 247, 0.08)); border-color: rgba(168, 85, 247, 0.4); box-shadow: 0 4px 20px rgba(168, 85, 247, 0.2), 0 1px 3px rgba(168, 85, 247, 0.1);",
          icon: "w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center transition-transform duration-300",
          text: "text-purple-400"
        },
        teal: {
          container: "group backdrop-blur-lg border rounded-xl p-8 text-center transition-all duration-300 relative overflow-hidden",
          containerStyle: "background: linear-gradient(135deg, rgba(20, 184, 166, 0.15), rgba(20, 184, 166, 0.08)); border-color: rgba(20, 184, 166, 0.4); box-shadow: 0 4px 20px rgba(20, 184, 166, 0.2), 0 1px 3px rgba(20, 184, 166, 0.1);",
          icon: "w-16 h-16 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center transition-transform duration-300",
          text: "text-teal-400"
        },
        rose: {
          container: "group backdrop-blur-lg border rounded-xl p-8 text-center transition-all duration-300 relative overflow-hidden",
          containerStyle: "background: linear-gradient(135deg, rgba(244, 63, 94, 0.15), rgba(244, 63, 94, 0.08)); border-color: rgba(244, 63, 94, 0.4); box-shadow: 0 4px 20px rgba(244, 63, 94, 0.2), 0 1px 3px rgba(244, 63, 94, 0.1);",
          icon: "w-16 h-16 bg-gradient-to-r from-rose-500 to-pink-500 rounded-2xl flex items-center justify-center transition-transform duration-300",
          text: "text-rose-400"
        }
      };
      const styles = variantStyles[variant];
      return renderTemplate`${maybeRenderHead()}<div${addAttribute(`${styles.container} ${className}`, "class")}${addAttribute(styles.containerStyle, "style")} data-astro-cid-romyxhz5> <div class="relative z-10" data-astro-cid-romyxhz5> <div class="h-16 mb-6 flex items-center justify-center" data-astro-cid-romyxhz5> <div${addAttribute(styles.icon, "class")} data-astro-cid-romyxhz5> ${renderComponent($$result, "Fragment", Fragment, {}, { "default": /* @__PURE__ */ __name(($$result2) => renderTemplate`${unescapeHTML(icon)}`, "default") })} </div> </div> <h3${addAttribute(`text-xl mb-4 ${styles.text} font-semibold`, "class")} data-astro-cid-romyxhz5>${title2}</h3> <p class="text-text-light-primary dark:text-text-dark-primary text-lg leading-relaxed mb-6 font-medium" data-astro-cid-romyxhz5> ${description} </p> <div${addAttribute(`${styles.text} text-sm font-medium`, "class")} data-astro-cid-romyxhz5> ${tags} </div> </div> </div> `;
    }, "/Volumes/MannyKnows/MK/MannyKnows/src/components/ui/servicecard.astro", void 0);
    $$Astro$62 = createAstro();
    $$Section = createComponent(($$result, $$props, $$slots) => {
      const Astro2 = $$result.createAstro($$Astro$62, $$props, $$slots);
      Astro2.self = $$Section;
      const {
        id,
        variant = "default",
        className = "",
        hasOverflow = false
      } = Astro2.props;
      const variantClasses = {
        default: "bg-gradient-to-br from-gray-50/90 via-gray-100/85 to-gray-200/90 dark:from-gray-900/90 dark:via-slate-800/85 dark:to-gray-900/90",
        dark: "bg-gradient-to-t from-gray-50/50 via-gray-100/30 to-gray-50/20 dark:from-gray-900/60 dark:via-slate-800/40 dark:to-gray-900/30",
        gradient: "bg-gradient-to-b from-gray-100/95 via-gray-150/90 to-gray-100/95 dark:bg-gradient-to-br dark:from-gray-900 dark:via-slate-800 dark:to-gray-900"
      };
      const overflowClass = hasOverflow ? "overflow-hidden" : "";
      return renderTemplate`${maybeRenderHead()}<section${addAttribute(id, "id")}${addAttribute(`relative py-16 ${variantClasses[variant]} border-t border-gray-300/30 dark:border-white/10 transition-colors duration-300 ${overflowClass} ${className}`, "class")}> ${renderSlot($$result, $$slots["default"])} </section>`;
    }, "/Volumes/MannyKnows/MK/MannyKnows/src/components/layout/section.astro", void 0);
    $$Astro$52 = createAstro();
    $$Container = createComponent(($$result, $$props, $$slots) => {
      const Astro2 = $$result.createAstro($$Astro$52, $$props, $$slots);
      Astro2.self = $$Container;
      const { maxWidth = "1440px", className = "" } = Astro2.props;
      return renderTemplate`${maybeRenderHead()}<div${addAttribute(`max-w-[${maxWidth}] mx-auto px-2 ${className}`, "class")}> ${renderSlot($$result, $$slots["default"])} </div>`;
    }, "/Volumes/MannyKnows/MK/MannyKnows/src/components/layout/container.astro", void 0);
    $$Astro$42 = createAstro();
    $$SectionHeader = createComponent(($$result, $$props, $$slots) => {
      const Astro2 = $$result.createAstro($$Astro$42, $$props, $$slots);
      Astro2.self = $$SectionHeader;
      const { title: title2, subtitle, alignment = "center", className = "" } = Astro2.props;
      const alignmentClasses = {
        left: "text-left",
        center: "text-center",
        right: "text-right"
      };
      return renderTemplate`${maybeRenderHead()}<div${addAttribute(`${alignmentClasses[alignment]} mb-20 ${className}`, "class")}> <h2 class="sf-bold apple-headline text-text-light-primary dark:text-text-dark-primary text-4xl md:text-6xl lg:text-7xl mb-6"> <span class="apple-gradient-text" data-colorful-title>${title2}</span> </h2> ${subtitle && renderTemplate`<p class="text-xl text-text-light-secondary dark:text-text-dark-secondary max-w-3xl mx-auto leading-relaxed"> ${subtitle} </p>`} </div>`;
    }, "/Volumes/MannyKnows/MK/MannyKnows/src/components/ui/SectionHeader.astro", void 0);
    $$Servicessection = createComponent(($$result, $$props, $$slots) => {
      const services = [
        {
          title: "AI-Powered E-commerce Websites",
          description: "Smart online stores that adapt to each customer with personalized experiences and dynamic product recommendations. Boost conversions by 40% with real-time optimization and intelligent visitor behavior tracking.",
          icon: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
    </svg>`,
          tags: "Personalization \u2022 A/B Testing \u2022 Conversion Optimization",
          variant: "indigo",
          pixelColors: "#6366f1, #3b82f6, #4f46e5"
        },
        {
          title: "E-commerce Automation",
          description: "Streamline your store operations with intelligent automation\u2014from inventory management to order processing. Save 10+ hours per week while eliminating 95% of manual errors and boosting your team's productivity.",
          icon: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="7.5,4.21 12,6.81 16.5,4.21"/>
      <polyline points="7.5,19.79 7.5,14.6 3,12"/>
      <polyline points="21,12 16.5,14.6 16.5,19.79"/>
      <polyline points="3.27,6.96 12,12.01 20.73,6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>`,
          tags: "Order Processing \u2022 Inventory Management \u2022 Customer Communications",
          variant: "green",
          pixelColors: "#22c55e, #10b981, #16a34a"
        },
        {
          title: "AI Sales & Customer Support",
          description: "24/7 intelligent customer support and sales assistants that understand your products and customers. Reduce support costs by 60% while improving customer satisfaction and increasing average order value.",
          icon: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      <path d="M8 3.13a4 4 0 0 0 0 7.75"/>
    </svg>`,
          tags: "Live Chat Support \u2022 Product Recommendations \u2022 Order Assistance",
          variant: "blue",
          pixelColors: "#3b82f6, #06b6d4, #2563eb"
        },
        {
          title: "E-commerce Analytics & Insights",
          description: "Transform your store data into actionable insights with predictive analytics that forecast sales trends and customer behavior. Make data-driven decisions 70% faster with intelligent dashboards and automated reporting.",
          icon: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>`,
          tags: "Sales Analytics \u2022 Customer Insights \u2022 Performance Tracking",
          variant: "orange",
          pixelColors: "#f97316, #eab308, #ea580c"
        },
        {
          title: "E-commerce Content Creation",
          description: "Generate high-converting product descriptions, email campaigns, and social media content that drives sales. Scale your marketing content 10x faster with AI that matches your brand voice and resonates with your customers.",
          icon: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14,2 14,8 20,8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10,9 9,9 8,9"/>
    </svg>`,
          tags: "Product Descriptions \u2022 Email Marketing \u2022 Social Media Content",
          variant: "purple",
          pixelColors: "#a855f7, #ec4899, #9333ea"
        },
        {
          title: "E-commerce Strategy & Training",
          description: "Comprehensive AI strategy development and hands-on training to transform your store team into e-commerce power users. Accelerate AI adoption with customized workshops and ongoing support for maximum ROI.",
          icon: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>`,
          tags: "Store Strategy \u2022 Team Training \u2022 Implementation Support",
          variant: "teal",
          pixelColors: "#14b8a6, #06b6d4, #0d9488"
        },
        {
          title: "E-commerce Photography & Creative",
          description: "Professional product photography and creative services that showcase your products beautifully. From lifestyle shoots to product catalogs, create compelling visual content that drives conversions and builds customer trust.",
          icon: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>`,
          tags: "Product Photography \u2022 Lifestyle Shoots \u2022 Brand Creative",
          variant: "rose",
          pixelColors: "#f43f5e, #ec4899, #e11d48"
        }
      ];
      return renderTemplate`${renderComponent($$result, "Section", $$Section, { "id": "services", "variant": "default", "hasOverflow": true, "data-astro-cid-ymcznbl2": true }, { "default": /* @__PURE__ */ __name(($$result2) => renderTemplate` ${renderComponent($$result2, "Container", $$Container, { "className": "relative z-10", "data-astro-cid-ymcznbl2": true }, { "default": /* @__PURE__ */ __name(($$result3) => renderTemplate` ${renderComponent($$result3, "SectionHeader", $$SectionHeader, { "title": "Artificial Intelligence", "subtitle": "Business Growing Services \u{1F30E}", "data-astro-cid-ymcznbl2": true })}  ${maybeRenderHead()}<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mx-auto mb-16" data-astro-cid-ymcznbl2> ${services.map((service) => renderTemplate`${renderComponent($$result3, "ServiceCard", $$Servicecard, { ...service, "data-astro-cid-ymcznbl2": true })}`)} <!-- Custom AI Solutions Card --> <div class="lg:col-span-2 flex items-center" data-astro-cid-ymcznbl2> <div data-astro-cid-ymcznbl2> <h2 class="sf-bold apple-headline text-text-light-primary dark:text-text-dark-primary text-3xl md:text-4xl lg:text-5xl mb-6" data-astro-cid-ymcznbl2> <span class="apple-gradient-text" data-colorful-title data-astro-cid-ymcznbl2>Custom AI Solutions for Growth</span> </h2> <p class="sf-medium apple-body-text text-xl md:text-2xl lg:text-3xl text-text-light-secondary dark:text-text-dark-secondary leading-relaxed mb-8" data-astro-cid-ymcznbl2>
We build and deploy intelligent automation to streamline operations, reduce costs, and scale your business. Go beyond off-the-shelf products with solutions tailored to your most repetitive tasks.
</p> <ul class="list-none p-0 mb-8 space-y-4" data-astro-cid-ymcznbl2> ${[
        "Boost productivity by 10x",
        "Slash operational costs",
        "Drive scalable growth",
        "Custom AI & API integration"
      ].map((benefit) => renderTemplate`<li class="flex items-center gap-3 text-text-light-primary dark:text-text-dark-primary text-lg" data-astro-cid-ymcznbl2> <svg class="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" data-astro-cid-ymcznbl2> <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" data-astro-cid-ymcznbl2></path> </svg> ${benefit} </li>`)} </ul> </div> </div> </div> `, "default") })} `, "default") })} `;
    }, "/Volumes/MannyKnows/MK/MannyKnows/src/components/sections/servicessection.astro", void 0);
    $$Astro$32 = createAstro();
    $$Reviewcard = createComponent(($$result, $$props, $$slots) => {
      const Astro2 = $$result.createAstro($$Astro$32, $$props, $$slots);
      Astro2.self = $$Reviewcard;
      const {
        customerName,
        testimonial,
        tags,
        rating = 5,
        className = ""
      } = Astro2.props;
      const colorVariants = {
        blue: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        green: "bg-green-500/10 text-green-500 border-green-500/20",
        purple: "bg-purple-500/10 text-purple-500 border-purple-500/20",
        pink: "bg-pink-500/10 text-pink-500 border-pink-500/20",
        violet: "bg-violet-500/10 text-violet-500 border-violet-500/20",
        red: "bg-red-500/10 text-red-500 border-red-500/20",
        indigo: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
        orange: "bg-orange-500/10 text-orange-500 border-orange-500/20",
        sky: "bg-sky-500/10 text-sky-500 border-sky-500/20",
        teal: "bg-teal-500/10 text-teal-500 border-teal-500/20",
        cyan: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20"
      };
      const glassmorphismColors = {
        blue: "#3b82f6",
        green: "#22c55e",
        purple: "#8b5cf6",
        pink: "#ec4899",
        violet: "#7c3aed",
        red: "#ef4444",
        indigo: "#4f46e5",
        orange: "#f97316",
        sky: "#0ea5e9",
        teal: "#14b8a6",
        cyan: "#06b6d4"
      };
      const primaryColor = glassmorphismColors[tags[0]?.color] || "#3b82f6";
      return renderTemplate`${maybeRenderHead()}<div${addAttribute(`w-full md:w-1/2 lg:w-1/3 flex-shrink-0 backdrop-blur-lg border rounded-xl p-8 transition-all duration-300 group relative overflow-hidden ${className}`, "class")}${addAttribute(`background: linear-gradient(135deg, ${primaryColor}15, ${primaryColor}08); border-color: ${primaryColor}40; box-shadow: 0 4px 20px ${primaryColor}20, 0 1px 3px ${primaryColor}10;`, "style")}> <!-- Enhanced glassmorphism overlay on hover --> <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"${addAttribute(`background: linear-gradient(135deg, ${primaryColor}08, ${primaryColor}05);`, "style")}></div> <!-- Enhanced glassmorphism overlay on hover --> <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"${addAttribute(`background: linear-gradient(135deg, ${primaryColor}08, ${primaryColor}05);`, "style")}></div> <!-- Card content with proper z-index --> <div class="relative z-10"> <div class="flex items-center justify-between mb-4"> <div class="flex items-center gap-1"> ${Array.from({ length: rating }, () => renderTemplate`<svg class="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 24 24"> <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path> </svg>`)} </div> <div class="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">${customerName}</div> </div> <blockquote class="text-text-light-primary dark:text-text-dark-primary text-lg leading-relaxed mb-6 font-medium">
"${testimonial}"
</blockquote> <div class="flex flex-wrap gap-2"> ${tags.map((tag) => renderTemplate`<span${addAttribute(`px-3 py-1 ${colorVariants[tag.color]} text-xs font-medium rounded-full border`, "class")}> ${tag.label} </span>`)} </div> </div> </div>`;
    }, "/Volumes/MannyKnows/MK/MannyKnows/src/components/ui/reviewcard.astro", void 0);
    $$Astro$22 = createAstro();
    $$StatsCard = createComponent(($$result, $$props, $$slots) => {
      const Astro2 = $$result.createAstro($$Astro$22, $$props, $$slots);
      Astro2.self = $$StatsCard;
      const {
        value,
        label,
        className = ""
      } = Astro2.props;
      return renderTemplate`${maybeRenderHead()}<div${addAttribute(`text-center ${className}`, "class")}> <div class="text-4xl md:text-5xl font-black text-text-light-primary dark:text-text-dark-primary mb-2"> ${value} </div> <div class="text-text-light-secondary dark:text-text-dark-secondary font-medium"> ${label} </div> </div>`;
    }, "/Volumes/MannyKnows/MK/MannyKnows/src/components/ui/StatsCard.astro", void 0);
    $$ReviewsSection = createComponent(($$result, $$props, $$slots) => {
      const reviews = [
        {
          customerName: "Sarah Chen",
          testimonial: "MannyKnows transformed our online store completely. Our conversion rates increased by 340% within 3 months, and the AI automation saves us 20+ hours weekly.",
          tags: [
            { label: "AI E-commerce", color: "blue" },
            { label: "Automation", color: "purple" },
            { label: "Analytics", color: "pink" }
          ]
        },
        {
          customerName: "Marcus Rodriguez",
          testimonial: "The product photography service is incredible. Our product pages look professional and sales have doubled. The team understands e-commerce visual needs perfectly.",
          tags: [
            { label: "Photography", color: "green" },
            { label: "Product Visuals", color: "blue" },
            { label: "Brand Design", color: "purple" }
          ]
        },
        {
          customerName: "Emily Watson",
          testimonial: "Custom AI integration revolutionized our customer support. Response time dropped 90% while satisfaction scores hit all-time highs. Exceptional technical expertise.",
          tags: [
            { label: "AI Integration", color: "purple" },
            { label: "Customer Support", color: "blue" },
            { label: "Automation", color: "green" }
          ]
        },
        {
          customerName: "David Kim",
          testimonial: "Our new website is blazing fast and converts like crazy. Mobile sales jumped 280% and our SEO rankings skyrocketed. Best investment we've made!",
          tags: [
            { label: "Web Development", color: "blue" },
            { label: "SEO", color: "green" },
            { label: "Mobile Optimization", color: "purple" }
          ]
        },
        {
          customerName: "Lisa Thompson",
          testimonial: "The social media automation is phenomenal. Our engagement tripled and we're generating 5x more qualified leads. The analytics insights are game-changing.",
          tags: [
            { label: "Social Media", color: "pink" },
            { label: "Automation", color: "purple" },
            { label: "Lead Generation", color: "blue" }
          ]
        },
        {
          customerName: "Robert Chen",
          testimonial: "Analytics & reporting gave us crystal clear insights into customer behavior. We optimized our funnel and saw a 420% increase in lifetime value!",
          tags: [
            { label: "Analytics", color: "blue" },
            { label: "Reporting", color: "purple" },
            { label: "Optimization", color: "green" }
          ]
        },
        {
          customerName: "Amanda Foster",
          testimonial: "The content creation service transformed our brand voice. Blog traffic increased 6x and we're now ranking #1 for our main keywords. Outstanding quality and strategy.",
          tags: [
            { label: "Content Creation", color: "blue" },
            { label: "SEO Content", color: "green" },
            { label: "Brand Strategy", color: "purple" }
          ]
        }
      ];
      const stats = [
        { value: "4+", label: "Happy Clients" },
        { value: "135%", label: "Avg. Sales Increase" },
        { value: "100%", label: "Client Satisfaction" },
        { value: "24/7", label: "Human Support" }
      ];
      return renderTemplate`${renderComponent($$result, "Section", $$Section, { "id": "reviews", "variant": "default", "hasOverflow": true, "data-astro-cid-cb5vetvs": true }, { "default": /* @__PURE__ */ __name(($$result2) => renderTemplate` ${renderComponent($$result2, "Container", $$Container, { "className": "relative z-10", "data-astro-cid-cb5vetvs": true }, { "default": /* @__PURE__ */ __name(($$result3) => renderTemplate` ${maybeRenderHead()}<div id="reviews-section" data-astro-cid-cb5vetvs> ${renderComponent($$result3, "SectionHeader", $$SectionHeader, { "title": "Customer Success Stories", "subtitle": "Discover how businesses like yours achieved remarkable growth with our AI-powered e-commerce solutions.", "data-astro-cid-cb5vetvs": true })} <!-- Reviews Carousel Container --> <div class="relative mb-12" data-astro-cid-cb5vetvs> <!-- Reviews Container --> <div class="py-4" data-astro-cid-cb5vetvs> <!-- Mobile: Single card view --> <div class="block md:hidden px-8" data-astro-cid-cb5vetvs> <div id="reviewsContainerMobile" class="flex transition-transform duration-300 ease-in-out" data-astro-cid-cb5vetvs> ${reviews.map((review) => {
        const primaryColor = review.tags[0]?.color === "blue" ? "#3b82f6" : review.tags[0]?.color === "green" ? "#22c55e" : review.tags[0]?.color === "purple" ? "#8b5cf6" : review.tags[0]?.color === "pink" ? "#ec4899" : "#3b82f6";
        return renderTemplate`<div class="w-full flex-shrink-0 px-2" data-astro-cid-cb5vetvs> <div class="backdrop-blur-lg border rounded-xl p-6 transition-all duration-300 group relative overflow-hidden"${addAttribute(`background: linear-gradient(135deg, ${primaryColor}15, ${primaryColor}08); border-color: ${primaryColor}40; box-shadow: 0 4px 20px ${primaryColor}20, 0 1px 3px ${primaryColor}10;`, "style")} data-astro-cid-cb5vetvs> <!-- Enhanced glassmorphism overlay --> <div class="absolute inset-0 opacity-0 transition-opacity duration-300 pointer-events-none"${addAttribute(`background: linear-gradient(135deg, ${primaryColor}08, ${primaryColor}05);`, "style")} data-astro-cid-cb5vetvs></div> <!-- Card content with proper z-index --> <div class="relative z-10" data-astro-cid-cb5vetvs> <div class="flex items-center justify-between mb-4" data-astro-cid-cb5vetvs> <div class="flex items-center gap-1" data-astro-cid-cb5vetvs> ${Array.from({ length: 5 }, () => renderTemplate`<svg class="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 24 24" data-astro-cid-cb5vetvs> <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" data-astro-cid-cb5vetvs></path> </svg>`)} </div> <div class="text-sm font-medium text-text-light-primary dark:text-text-dark-primary" data-astro-cid-cb5vetvs>${review.customerName}</div> </div> <blockquote class="text-text-light-primary dark:text-text-dark-primary text-lg leading-relaxed mb-6 font-medium" data-astro-cid-cb5vetvs>
"${review.testimonial}"
</blockquote> <div class="flex flex-wrap gap-2" data-astro-cid-cb5vetvs> ${review.tags.map((tag) => renderTemplate`<span${addAttribute(`px-3 py-1 text-xs font-medium rounded-full border 
                            ${tag.color === "blue" ? "bg-blue-500/10 text-blue-500 border-blue-500/20" : ""}
                            ${tag.color === "green" ? "bg-green-500/10 text-green-500 border-green-500/20" : ""}
                            ${tag.color === "purple" ? "bg-purple-500/10 text-purple-500 border-purple-500/20" : ""}
                            ${tag.color === "pink" ? "bg-pink-500/10 text-pink-500 border-pink-500/20" : ""}
                          `, "class")} data-astro-cid-cb5vetvs> ${tag.label} </span>`)} </div> </div> </div> </div>`;
      })} </div> </div> <!-- Desktop: Multi-card view --> <div class="hidden md:block px-16" data-astro-cid-cb5vetvs> <div id="reviewsContainer" class="flex gap-8 transition-transform duration-500 ease-in-out" data-astro-cid-cb5vetvs> ${reviews.map((review) => renderTemplate`${renderComponent($$result3, "ReviewCard", $$Reviewcard, { ...review, "data-astro-cid-cb5vetvs": true })}`)} </div> </div> </div> </div> <!-- Carousel Navigation --> <div class="flex justify-center gap-6 mb-16" data-astro-cid-cb5vetvs> <button id="prevReview" class="group flex items-center justify-center w-12 h-12 backdrop-blur-lg border border-gray-200/30 dark:border-white/20 rounded-full text-text-light-primary dark:text-text-dark-primary transition-all duration-300 relative overflow-hidden" style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.08)); box-shadow: 0 4px 20px rgba(59, 130, 246, 0.2), 0 1px 3px rgba(59, 130, 246, 0.1);" aria-label="Previous review" data-astro-cid-cb5vetvs> <!-- Enhanced glassmorphism overlay on hover --> <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(59, 130, 246, 0.05));" data-astro-cid-cb5vetvs></div> <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" class="relative z-10" data-astro-cid-cb5vetvs> <polyline points="15,18 9,12 15,6" data-astro-cid-cb5vetvs></polyline> </svg> </button> <button id="nextReview" class="group flex items-center justify-center w-12 h-12 backdrop-blur-lg border border-gray-200/30 dark:border-white/20 rounded-full text-text-light-primary dark:text-text-dark-primary transition-all duration-300 relative overflow-hidden" style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.08)); box-shadow: 0 4px 20px rgba(59, 130, 246, 0.2), 0 1px 3px rgba(59, 130, 246, 0.1);" aria-label="Next review" data-astro-cid-cb5vetvs> <!-- Enhanced glassmorphism overlay on hover --> <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(59, 130, 246, 0.05));" data-astro-cid-cb5vetvs></div> <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" class="relative z-10" data-astro-cid-cb5vetvs> <polyline points="9,18 15,12 9,6" data-astro-cid-cb5vetvs></polyline> </svg> </button> </div> <!-- Stats Section --> <div class="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16" data-astro-cid-cb5vetvs> ${stats.map((stat2) => renderTemplate`${renderComponent($$result3, "StatsCard", $$StatsCard, { ...stat2, "data-astro-cid-cb5vetvs": true })}`)} </div> <!-- Call to Action --> <div class="text-center" data-astro-cid-cb5vetvs> ${renderComponent($$result3, "Button", $$Button, { "href": "/contact-us", "text": "Join Our Success Stories", "variant": "cta", "size": "lg", "arrow": true, "sparkleTheme": "cyan", "data-astro-cid-cb5vetvs": true })} </div> </div> `, "default") })} `, "default") })}  ${renderScript($$result, "/Volumes/MannyKnows/MK/MannyKnows/src/components/sections/ReviewsSection.astro?astro&type=script&index=0&lang.ts")}`;
    }, "/Volumes/MannyKnows/MK/MannyKnows/src/components/sections/ReviewsSection.astro", void 0);
    $$Astro$12 = createAstro();
    $$PageSection = createComponent(($$result, $$props, $$slots) => {
      const Astro2 = $$result.createAstro($$Astro$12, $$props, $$slots);
      Astro2.self = $$PageSection;
      const {
        id,
        title: title2,
        subtitle,
        variant = "default",
        className = "",
        headerAlignment = "center"
      } = Astro2.props;
      const variantStyles = {
        default: "bg-light-primary dark:bg-dark-primary",
        alternate: "bg-gradient-to-br from-gray-50/90 via-gray-100/85 to-gray-200/90 dark:from-gray-900/90 dark:via-slate-800/85 dark:to-gray-900/90 border-t border-gray-300/30 dark:border-white/10",
        dark: "bg-gradient-to-br from-slate-900/95 via-gray-900/90 to-slate-800/95 border-t border-white/10"
      };
      const alignmentStyles = {
        left: "text-left",
        center: "text-center",
        right: "text-right"
      };
      const sectionClass = `relative py-16 ${variantStyles[variant]} transition-colors duration-300 overflow-hidden ${className}`;
      const headerClass = `${alignmentStyles[headerAlignment]} mb-20`;
      return renderTemplate`${maybeRenderHead()}<section${addAttribute(id, "id")}${addAttribute(sectionClass, "class")}> <div class="max-w-[1440px] mx-auto px-8 relative z-10"> ${(title2 || subtitle) && renderTemplate`<div${addAttribute(headerClass, "class")}> ${title2 && renderTemplate`<h2 class="sf-bold apple-headline text-text-light-primary dark:text-text-dark-primary text-4xl md:text-6xl lg:text-7xl mb-6"> <span class="apple-gradient-text" data-colorful-title> ${title2} </span> </h2>`} ${subtitle && renderTemplate`<p${addAttribute(["text-xl text-text-light-secondary dark:text-text-dark-secondary max-w-3xl leading-relaxed", [
        headerAlignment === "center" && "mx-auto",
        headerAlignment === "right" && "ml-auto"
      ]], "class:list")}> ${subtitle} </p>`} </div>`} ${renderSlot($$result, $$slots["default"])} </div> </section>`;
    }, "/Volumes/MannyKnows/MK/MannyKnows/src/components/layout/PageSection.astro", void 0);
    $$Astro3 = createAstro();
    $$Processsectionalt = createComponent(($$result, $$props, $$slots) => {
      const Astro2 = $$result.createAstro($$Astro3, $$props, $$slots);
      Astro2.self = $$Processsectionalt;
      const { className = "" } = Astro2.props;
      const gradientColors = [
        "#10d1ff",
        // 1 - Cyan
        "#0071e3",
        // 2 - Apple blue
        "#3b5bd6",
        // 3 - Blue-purple blend
        "#5856d6",
        // 4 - Purple
        "#a855f7",
        // 5 - Magenta
        "#ec4899"
        // 6 - Pink
      ];
      const processSteps = [
        {
          number: "1.",
          title: "AI Strategy & Discovery",
          description: "We analyze your business goals, current e-commerce setup, and identify AI automation opportunities to maximize growth potential.",
          color: "#10d1ff",
          // Primary blue
          bgColor: "rgba(16, 209, 255, 0.08)",
          iconColor: "#10d1ff",
          gradient: "from-blue-500 to-cyan-500",
          icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
      <line x1="9" y1="9" x2="9.01" y2="9"/>
      <line x1="15" y1="9" x2="15.01" y2="9"/>
    </svg>`
        },
        {
          number: "2.",
          title: "E-commerce Architecture Design",
          description: "Design scalable, AI-ready e-commerce architecture with planned integrations, data flows, and user experience blueprints.",
          color: "#0071e3",
          // Secondary blue
          bgColor: "rgba(0, 113, 227, 0.08)",
          iconColor: "#0071e3",
          gradient: "from-indigo-500 to-blue-500",
          icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 19l7-7 3 3-7 7-3-3z"/>
      <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
      <path d="M2 2l7.586 7.586"/>
      <circle cx="11" cy="11" r="2"/>
    </svg>`
        },
        {
          number: "3.",
          title: "AI Implementation & Development",
          description: "Build custom AI solutions, integrate automation tools, and develop responsive, high-converting interfaces tailored to your needs.",
          color: "#5856d6",
          // Purple
          bgColor: "rgba(88, 86, 214, 0.08)",
          iconColor: "#5856d6",
          gradient: "from-purple-500 to-pink-500",
          icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="16,18 22,12 16,6"/>
      <polyline points="8,6 2,12 8,18"/>
    </svg>`
        },
        {
          number: "4.",
          title: "Testing & Optimization",
          description: "Rigorous testing of AI functionality, user experience optimization, performance tuning, and conversion rate validation.",
          color: "#22c55e",
          // Green
          bgColor: "rgba(34, 197, 94, 0.08)",
          iconColor: "#22c55e",
          gradient: "from-green-500 to-emerald-500",
          icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="9,11 12,14 22,4"/>
      <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C13.3968 3 14.7178 3.35587 15.8871 4"/>
    </svg>`
        },
        {
          number: "5.",
          title: "Launch & Scale",
          description: "Deploy your AI-powered e-commerce solution, monitor performance, and implement continuous improvement strategies for scaling.",
          color: "#f59e0b",
          // Amber/Gold
          bgColor: "rgba(245, 158, 11, 0.08)",
          iconColor: "#f59e0b",
          gradient: "from-orange-500 to-yellow-500",
          icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M6 3h12l4 6-10 13L2 9l4-6z"/>
      <path d="M11 3L8 9l4 13 4-13-3-6"/>
      <path d="M2 9h20"/>
    </svg>`
        },
        {
          number: "6.",
          title: "Growth & Support",
          description: "Ongoing support, performance monitoring, and strategic growth initiatives to maximize your e-commerce success and ROI.",
          color: "#ef4444",
          // Red
          bgColor: "rgba(239, 68, 68, 0.08)",
          iconColor: "#ef4444",
          gradient: "from-rose-500 to-pink-500",
          icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
    </svg>`
        }
      ];
      return renderTemplate`${maybeRenderHead()}<div${addAttribute(`ai-process-container max-w-[1440px] mx-auto relative z-10 ${className}`, "class")} data-astro-cid-3w5vlsqg> <div class="process-grid" data-astro-cid-3w5vlsqg> ${processSteps.map((step, index) => renderTemplate`<div${addAttribute(`process-card-wrapper ${index % 2 === 0 ? "left-number-right-card" : "right-number-left-card"}`, "class")}${addAttribute(index, "data-step")} data-astro-cid-3w5vlsqg>  <div class="step-row" data-astro-cid-3w5vlsqg>  <div class="step-left" data-astro-cid-3w5vlsqg> ${index % 2 === 0 ? (
        // Even steps (1,3,5): Number and card together on left side
        renderTemplate`<div class="step-group" data-astro-cid-3w5vlsqg> <div${addAttribute(`step-number-large`, "class")}${addAttribute(`color: ${gradientColors[index]}`, "style")}${addAttribute(index, "data-target-step")} role="button" tabindex="0"${addAttribute(`Step ${step.number.slice(0, -1)}: ${step.title}`, "aria-label")} data-astro-cid-3w5vlsqg> <span class="sf-black" data-astro-cid-3w5vlsqg><span class="number-part" data-astro-cid-3w5vlsqg>${step.number.slice(0, -1)}</span><span class="dot-part" data-astro-cid-3w5vlsqg>.</span></span> </div> <div class="process-card group backdrop-blur-lg border rounded-xl p-8 text-center relative overflow-hidden"${addAttribute(`background: linear-gradient(135deg, ${gradientColors[index]}15, ${gradientColors[index]}08); border-color: ${gradientColors[index]}40; box-shadow: 0 4px 20px ${gradientColors[index]}20, 0 1px 3px ${gradientColors[index]}10;`, "style")}${addAttribute(index, "data-step-index")} role="article"${addAttribute(`step-title-${index}-left`, "aria-labelledby")} data-astro-cid-3w5vlsqg> <div class="step-content" data-astro-cid-3w5vlsqg> <div class="step-header" data-astro-cid-3w5vlsqg> <div class="step-icon-container"${addAttribute(`background-color: ${gradientColors[index]}15; border: 2px solid ${gradientColors[index]}40`, "style")} aria-hidden="true" data-astro-cid-3w5vlsqg> <div class="step-icon"${addAttribute(`color: ${gradientColors[index]}`, "style")} data-astro-cid-3w5vlsqg> ${renderComponent($$result, "Fragment", Fragment, {}, { "default": /* @__PURE__ */ __name(($$result2) => renderTemplate`${unescapeHTML(step.icon)}`, "default") })} </div> </div> <h3 class="step-title sf-semibold"${addAttribute(`step-title-${index}-left`, "id")} data-astro-cid-3w5vlsqg>${step.title}</h3> </div> <p class="text-text-light-primary dark:text-text-dark-primary text-lg leading-relaxed mb-6 font-medium" data-astro-cid-3w5vlsqg>${step.description}</p> </div> </div> </div>`
      ) : (
        // Odd steps: Empty left side
        renderTemplate`<div class="empty-side" data-astro-cid-3w5vlsqg></div>`
      )} </div>  <div class="step-right" data-astro-cid-3w5vlsqg> ${index % 2 === 1 ? (
        // Odd steps (2,4,6): Number and card together on right side
        renderTemplate`<div class="step-group" data-astro-cid-3w5vlsqg> <div${addAttribute(`step-number-large`, "class")}${addAttribute(`color: ${gradientColors[index]}`, "style")}${addAttribute(index, "data-target-step")} role="button" tabindex="0"${addAttribute(`Step ${step.number.slice(0, -1)}: ${step.title}`, "aria-label")} data-astro-cid-3w5vlsqg> <span class="sf-black" data-astro-cid-3w5vlsqg><span class="number-part" data-astro-cid-3w5vlsqg>${step.number.slice(0, -1)}</span><span class="dot-part" data-astro-cid-3w5vlsqg>.</span></span> </div> <div class="process-card group backdrop-blur-lg border rounded-xl p-8 text-center relative overflow-hidden"${addAttribute(`background: linear-gradient(135deg, ${gradientColors[index]}15, ${gradientColors[index]}08); border-color: ${gradientColors[index]}40; box-shadow: 0 4px 20px ${gradientColors[index]}20, 0 1px 3px ${gradientColors[index]}10;`, "style")}${addAttribute(index, "data-step-index")} role="article"${addAttribute(`step-title-${index}-right`, "aria-labelledby")} data-astro-cid-3w5vlsqg> <div class="step-content" data-astro-cid-3w5vlsqg> <div class="step-header" data-astro-cid-3w5vlsqg> <div class="step-icon-container"${addAttribute(`background-color: ${gradientColors[index]}15; border: 2px solid ${gradientColors[index]}40`, "style")} aria-hidden="true" data-astro-cid-3w5vlsqg> <div class="step-icon"${addAttribute(`color: ${gradientColors[index]}`, "style")} data-astro-cid-3w5vlsqg> ${renderComponent($$result, "Fragment", Fragment, {}, { "default": /* @__PURE__ */ __name(($$result2) => renderTemplate`${unescapeHTML(step.icon)}`, "default") })} </div> </div> <h3 class="step-title sf-semibold"${addAttribute(`step-title-${index}-right`, "id")} data-astro-cid-3w5vlsqg>${step.title}</h3> </div> <p class="text-text-light-primary dark:text-text-dark-primary text-lg leading-relaxed mb-6 font-medium" data-astro-cid-3w5vlsqg>${step.description}</p> </div> </div> </div>`
      ) : (
        // Even steps on mobile: Show content on right side too
        renderTemplate`<div class="mobile-content" data-astro-cid-3w5vlsqg> <div${addAttribute(`step-number-large number-mobile`, "class")}${addAttribute(`color: ${gradientColors[index]}`, "style")}${addAttribute(index, "data-target-step")} role="button" tabindex="0"${addAttribute(`Step ${step.number.slice(0, -1)}: ${step.title}`, "aria-label")} data-astro-cid-3w5vlsqg> <span class="sf-black" data-astro-cid-3w5vlsqg><span class="number-part" data-astro-cid-3w5vlsqg>${step.number.slice(0, -1)}</span><span class="dot-part" data-astro-cid-3w5vlsqg>.</span></span> </div> <div class="process-card group backdrop-blur-lg border rounded-xl p-8 text-center relative overflow-hidden"${addAttribute(`background: linear-gradient(135deg, ${gradientColors[index]}15, ${gradientColors[index]}08); border-color: ${gradientColors[index]}40; box-shadow: 0 4px 20px ${gradientColors[index]}20, 0 1px 3px ${gradientColors[index]}10;`, "style")}${addAttribute(index, "data-step-index")} role="article"${addAttribute(`step-title-${index}-mobile`, "aria-labelledby")} data-astro-cid-3w5vlsqg> <div class="step-content" data-astro-cid-3w5vlsqg> <div class="step-header" data-astro-cid-3w5vlsqg> <div class="step-icon-container"${addAttribute(`background-color: ${gradientColors[index]}15; border: 2px solid ${gradientColors[index]}40`, "style")} aria-hidden="true" data-astro-cid-3w5vlsqg> <div class="step-icon"${addAttribute(`color: ${gradientColors[index]}`, "style")} data-astro-cid-3w5vlsqg> ${renderComponent($$result, "Fragment", Fragment, {}, { "default": /* @__PURE__ */ __name(($$result2) => renderTemplate`${unescapeHTML(step.icon)}`, "default") })} </div> </div> <h3 class="step-title sf-semibold"${addAttribute(`step-title-${index}-mobile`, "id")} data-astro-cid-3w5vlsqg>${step.title}</h3> </div> <p class="text-text-light-primary dark:text-text-dark-primary text-lg leading-relaxed mb-6 font-medium" data-astro-cid-3w5vlsqg>${step.description}</p> </div> </div> </div>`
      )} </div> </div> </div>`)} </div>  <div class="final-arrow"${addAttribute(`color: ${gradientColors[5]}`, "style")} data-astro-cid-3w5vlsqg> <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-astro-cid-3w5vlsqg> <polyline points="6,9 12,15 18,9" data-astro-cid-3w5vlsqg></polyline> </svg> </div> </div>  ${renderScript($$result, "/Volumes/MannyKnows/MK/MannyKnows/src/components/sections/processsectionalt.astro?astro&type=script&index=0&lang.ts")}`;
    }, "/Volumes/MannyKnows/MK/MannyKnows/src/components/sections/processsectionalt.astro", void 0);
    $$Index = createComponent(($$result, $$props, $$slots) => {
      const NAVBAR_CONFIG = {
        // Search gradient animations in navbar
        searchGradientEnabled: true,
        searchScrollDelay: 0,
        // Debug mode for development
        debugMode: false
      };
      return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "MK - AI-Powered Software on-demand & E-commerce Solutions by Manny" }, { "default": /* @__PURE__ */ __name(($$result2) => renderTemplate` ${maybeRenderHead()}<main class="relative bg-light-primary dark:bg-dark-primary text-text-light-primary dark:text-text-dark-primary min-h-screen transition-colors duration-300"> <!-- Marquee Announcement Section --> ${renderComponent($$result2, "MarqueeSimple", $$MarqueeSimple, {})} <!-- Header Container with Subtle Background --> <header class="relative bg-gradient-to-t from-gray-50/50 via-gray-100/30 to-gray-50/20 dark:from-gray-900/60 dark:via-slate-800/40 dark:to-gray-900/30 transition-colors duration-300"> <!-- Navigation --> ${renderComponent($$result2, "NavBar", $$NavBar, { "animationConfig": {
        searchGradientEnabled: NAVBAR_CONFIG.searchGradientEnabled,
        debugMode: NAVBAR_CONFIG.debugMode,
        searchScrollDelay: NAVBAR_CONFIG.searchScrollDelay
      } })} <!-- Hero Section --> ${renderComponent($$result2, "HeroSection", $$HeroSection, { "title": "Scale your", "highlightedText": "business operations", "subtitle": "Optimize your operations from end to end with intelligent AI. We automate critical tasks across your marketing, sales, and support workflows to boost productivity, cut costs, and drive scalable growth." })} </header> <!-- Services Section --> ${renderComponent($$result2, "ServicesSection", $$Servicessection, {})} <!-- Products Section --> ${renderComponent($$result2, "PageSection", $$PageSection, { "id": "products", "title": "Our Products", "subtitle": "Discover our range of AI-powered e-commerce solutions designed to elevate your business.", "variant": "alternate" })} <!-- Process Section --> ${renderComponent($$result2, "PageSection", $$PageSection, { "id": "process", "title": "Our Process", "subtitle": "From discovery to deployment we follow a proven methodology to transform your e-commerce vision into reality", "variant": "alternate" }, { "default": /* @__PURE__ */ __name(($$result3) => renderTemplate` ${renderComponent($$result3, "ProcessSectionAlt", $$Processsectionalt, {})} `, "default") })} <!-- Customer Reviews Section --> ${renderComponent($$result2, "ReviewsSection", $$ReviewsSection, {})} <!-- Chat Box --> ${renderComponent($$result2, "ChatBox", $$ChatBox, {})} <!-- Floating Dock Menu --> ${renderComponent($$result2, "DockMenu", $$DockMenu, {})} </main> `, "default") })}`;
    }, "/Volumes/MannyKnows/MK/MannyKnows/src/pages/index.astro", void 0);
    $$file2 = "/Volumes/MannyKnows/MK/MannyKnows/src/pages/index.astro";
    $$url2 = "";
    _page8 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
      __proto__: null,
      default: $$Index,
      file: $$file2,
      url: $$url2
    }, Symbol.toStringTag, { value: "Module" }));
    page8 = /* @__PURE__ */ __name(() => _page8, "page");
  }
});

// dist/_worker.js/_noop-actions.mjs
var noop_actions_exports = {};
__export(noop_actions_exports, {
  server: () => server
});
var server;
var init_noop_actions = __esm({
  "dist/_worker.js/_noop-actions.mjs"() {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    globalThis.process ??= {};
    globalThis.process.env ??= {};
    server = {};
  }
});

// dist/_worker.js/_astro-internal_middleware.mjs
var astro_internal_middleware_exports = {};
__export(astro_internal_middleware_exports, {
  onRequest: () => onRequest
});
var onRequest$1, onRequest;
var init_astro_internal_middleware = __esm({
  "dist/_worker.js/_astro-internal_middleware.mjs"() {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_astro_designed_error_pages_zET6Ym84();
    init_server_BRKsKzpO();
    init_index_BOXgeMNR();
    globalThis.process ??= {};
    globalThis.process.env ??= {};
    onRequest$1 = /* @__PURE__ */ __name((context2, next) => {
      if (context2.isPrerendered) {
        context2.locals.runtime ??= {
          env: process.env
        };
      }
      return next();
    }, "onRequest$1");
    onRequest = sequence(
      onRequest$1
    );
  }
});

// .wrangler/tmp/bundle-mlX9RA/middleware-loader.entry.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// .wrangler/tmp/bundle-mlX9RA/middleware-insertion-facade.js
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// dist/_worker.js/index.js
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
init_renderers();

// dist/_worker.js/chunks/_@astrojs-ssr-adapter_BMnV9V6n.mjs
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
init_index_BOXgeMNR();
init_server_BRKsKzpO();
init_astro_designed_error_pages_zET6Ym84();

// dist/_worker.js/chunks/noop-middleware_YAKwe5pu.mjs
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
init_server_BRKsKzpO();
globalThis.process ??= {};
globalThis.process.env ??= {};
var NOOP_MIDDLEWARE_FN = /* @__PURE__ */ __name(async (_ctx, next) => {
  const response = await next();
  response.headers.set(NOOP_MIDDLEWARE_HEADER, "true");
  return response;
}, "NOOP_MIDDLEWARE_FN");

// dist/_worker.js/chunks/_@astrojs-ssr-adapter_BMnV9V6n.mjs
import "cloudflare:workers";
globalThis.process ??= {};
globalThis.process.env ??= {};
function createI18nMiddleware(i18n, base, trailingSlash, format) {
  if (!i18n) return (_, next) => next();
  const payload = {
    ...i18n,
    trailingSlash,
    base,
    format
  };
  const _redirectToDefaultLocale = redirectToDefaultLocale(payload);
  const _noFoundForNonLocaleRoute = notFound(payload);
  const _requestHasLocale = requestHasLocale(payload.locales);
  const _redirectToFallback = redirectToFallback(payload);
  const prefixAlways = /* @__PURE__ */ __name((context2, response) => {
    const url = context2.url;
    if (url.pathname === base + "/" || url.pathname === base) {
      return _redirectToDefaultLocale(context2);
    } else if (!_requestHasLocale(context2)) {
      return _noFoundForNonLocaleRoute(context2, response);
    }
    return void 0;
  }, "prefixAlways");
  const prefixOtherLocales = /* @__PURE__ */ __name((context2, response) => {
    let pathnameContainsDefaultLocale = false;
    const url = context2.url;
    for (const segment of url.pathname.split("/")) {
      if (normalizeTheLocale(segment) === normalizeTheLocale(i18n.defaultLocale)) {
        pathnameContainsDefaultLocale = true;
        break;
      }
    }
    if (pathnameContainsDefaultLocale) {
      const newLocation = url.pathname.replace(`/${i18n.defaultLocale}`, "");
      response.headers.set("Location", newLocation);
      return _noFoundForNonLocaleRoute(context2);
    }
    return void 0;
  }, "prefixOtherLocales");
  return async (context2, next) => {
    const response = await next();
    const type = response.headers.get(ROUTE_TYPE_HEADER);
    const isReroute = response.headers.get(REROUTE_DIRECTIVE_HEADER);
    if (isReroute === "no" && typeof i18n.fallback === "undefined") {
      return response;
    }
    if (type !== "page" && type !== "fallback") {
      return response;
    }
    if (requestIs404Or500(context2.request, base)) {
      return response;
    }
    if (isRequestServerIsland(context2.request, base)) {
      return response;
    }
    const { currentLocale } = context2;
    switch (i18n.strategy) {
      // NOTE: theoretically, we should never hit this code path
      case "manual": {
        return response;
      }
      case "domains-prefix-other-locales": {
        if (localeHasntDomain(i18n, currentLocale)) {
          const result = prefixOtherLocales(context2, response);
          if (result) {
            return result;
          }
        }
        break;
      }
      case "pathname-prefix-other-locales": {
        const result = prefixOtherLocales(context2, response);
        if (result) {
          return result;
        }
        break;
      }
      case "domains-prefix-always-no-redirect": {
        if (localeHasntDomain(i18n, currentLocale)) {
          const result = _noFoundForNonLocaleRoute(context2, response);
          if (result) {
            return result;
          }
        }
        break;
      }
      case "pathname-prefix-always-no-redirect": {
        const result = _noFoundForNonLocaleRoute(context2, response);
        if (result) {
          return result;
        }
        break;
      }
      case "pathname-prefix-always": {
        const result = prefixAlways(context2, response);
        if (result) {
          return result;
        }
        break;
      }
      case "domains-prefix-always": {
        if (localeHasntDomain(i18n, currentLocale)) {
          const result = prefixAlways(context2, response);
          if (result) {
            return result;
          }
        }
        break;
      }
    }
    return _redirectToFallback(context2, response);
  };
}
__name(createI18nMiddleware, "createI18nMiddleware");
function localeHasntDomain(i18n, currentLocale) {
  for (const domainLocale of Object.values(i18n.domainLookupTable)) {
    if (domainLocale === currentLocale) {
      return false;
    }
  }
  return true;
}
__name(localeHasntDomain, "localeHasntDomain");
var NOOP_ACTIONS_MOD = {
  server: {}
};
var FORM_CONTENT_TYPES = [
  "application/x-www-form-urlencoded",
  "multipart/form-data",
  "text/plain"
];
var SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];
function createOriginCheckMiddleware() {
  return defineMiddleware((context2, next) => {
    const { request, url, isPrerendered } = context2;
    if (isPrerendered) {
      return next();
    }
    if (SAFE_METHODS.includes(request.method)) {
      return next();
    }
    const isSameOrigin = request.headers.get("origin") === url.origin;
    const hasContentType2 = request.headers.has("content-type");
    if (hasContentType2) {
      const formLikeHeader = hasFormLikeHeader(request.headers.get("content-type"));
      if (formLikeHeader && !isSameOrigin) {
        return new Response(`Cross-site ${request.method} form submissions are forbidden`, {
          status: 403
        });
      }
    } else {
      if (!isSameOrigin) {
        return new Response(`Cross-site ${request.method} form submissions are forbidden`, {
          status: 403
        });
      }
    }
    return next();
  });
}
__name(createOriginCheckMiddleware, "createOriginCheckMiddleware");
function hasFormLikeHeader(contentType) {
  if (contentType) {
    for (const FORM_CONTENT_TYPE of FORM_CONTENT_TYPES) {
      if (contentType.toLowerCase().includes(FORM_CONTENT_TYPE)) {
        return true;
      }
    }
  }
  return false;
}
__name(hasFormLikeHeader, "hasFormLikeHeader");
function createDefaultRoutes(manifest2) {
  const root = new URL(manifest2.hrefRoot);
  return [
    {
      instance: default404Instance,
      matchesComponent: /* @__PURE__ */ __name((filePath) => filePath.href === new URL(DEFAULT_404_COMPONENT, root).href, "matchesComponent"),
      route: DEFAULT_404_ROUTE.route,
      component: DEFAULT_404_COMPONENT
    },
    {
      instance: createEndpoint(manifest2),
      matchesComponent: /* @__PURE__ */ __name((filePath) => filePath.href === new URL(SERVER_ISLAND_COMPONENT, root).href, "matchesComponent"),
      route: SERVER_ISLAND_ROUTE,
      component: SERVER_ISLAND_COMPONENT
    }
  ];
}
__name(createDefaultRoutes, "createDefaultRoutes");
var Pipeline = class {
  static {
    __name(this, "Pipeline");
  }
  constructor(logger, manifest2, runtimeMode, renderers2, resolve, serverLike, streaming, adapterName = manifest2.adapterName, clientDirectives = manifest2.clientDirectives, inlinedScripts = manifest2.inlinedScripts, compressHTML = manifest2.compressHTML, i18n = manifest2.i18n, middleware = manifest2.middleware, routeCache = new RouteCache(logger, runtimeMode), site = manifest2.site ? new URL(manifest2.site) : void 0, defaultRoutes = createDefaultRoutes(manifest2), actions = manifest2.actions) {
    this.logger = logger;
    this.manifest = manifest2;
    this.runtimeMode = runtimeMode;
    this.renderers = renderers2;
    this.resolve = resolve;
    this.serverLike = serverLike;
    this.streaming = streaming;
    this.adapterName = adapterName;
    this.clientDirectives = clientDirectives;
    this.inlinedScripts = inlinedScripts;
    this.compressHTML = compressHTML;
    this.i18n = i18n;
    this.middleware = middleware;
    this.routeCache = routeCache;
    this.site = site;
    this.defaultRoutes = defaultRoutes;
    this.actions = actions;
    this.internalMiddleware = [];
    if (i18n?.strategy !== "manual") {
      this.internalMiddleware.push(
        createI18nMiddleware(i18n, manifest2.base, manifest2.trailingSlash, manifest2.buildFormat)
      );
    }
  }
  internalMiddleware;
  resolvedMiddleware = void 0;
  resolvedActions = void 0;
  /**
   * Resolves the middleware from the manifest, and returns the `onRequest` function. If `onRequest` isn't there,
   * it returns a no-op function
   */
  async getMiddleware() {
    if (this.resolvedMiddleware) {
      return this.resolvedMiddleware;
    } else if (this.middleware) {
      const middlewareInstance = await this.middleware();
      const onRequest2 = middlewareInstance.onRequest ?? NOOP_MIDDLEWARE_FN;
      const internalMiddlewares = [onRequest2];
      if (this.manifest.checkOrigin) {
        internalMiddlewares.unshift(createOriginCheckMiddleware());
      }
      this.resolvedMiddleware = sequence(...internalMiddlewares);
      return this.resolvedMiddleware;
    } else {
      this.resolvedMiddleware = NOOP_MIDDLEWARE_FN;
      return this.resolvedMiddleware;
    }
  }
  setActions(actions) {
    this.resolvedActions = actions;
  }
  async getActions() {
    if (this.resolvedActions) {
      return this.resolvedActions;
    } else if (this.actions) {
      return await this.actions();
    }
    return NOOP_ACTIONS_MOD;
  }
  async getAction(path) {
    const pathKeys = path.split(".").map((key) => decodeURIComponent(key));
    let { server: server2 } = await this.getActions();
    if (!server2 || !(typeof server2 === "object")) {
      throw new TypeError(
        `Expected \`server\` export in actions file to be an object. Received ${typeof server2}.`
      );
    }
    for (const key of pathKeys) {
      if (!(key in server2)) {
        throw new AstroError({
          ...ActionNotFoundError,
          message: ActionNotFoundError.message(pathKeys.join("."))
        });
      }
      server2 = server2[key];
    }
    if (typeof server2 !== "function") {
      throw new TypeError(
        `Expected handler for action ${pathKeys.join(".")} to be a function. Received ${typeof server2}.`
      );
    }
    return server2;
  }
};
var RedirectComponentInstance = {
  default() {
    return new Response(null, {
      status: 301
    });
  }
};
var RedirectSinglePageBuiltModule = {
  page: /* @__PURE__ */ __name(() => Promise.resolve(RedirectComponentInstance), "page"),
  onRequest: /* @__PURE__ */ __name((_, next) => next(), "onRequest"),
  renderers: []
};
var dateTimeFormat = new Intl.DateTimeFormat([], {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false
});
var levels = {
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  silent: 90
};
function log3(opts, level, label, message, newLine = true) {
  const logLevel = opts.level;
  const dest = opts.dest;
  const event = {
    label,
    level,
    message,
    newLine
  };
  if (!isLogLevelEnabled(logLevel, level)) {
    return;
  }
  dest.write(event);
}
__name(log3, "log");
function isLogLevelEnabled(configuredLogLevel, level) {
  return levels[configuredLogLevel] <= levels[level];
}
__name(isLogLevelEnabled, "isLogLevelEnabled");
function info3(opts, label, message, newLine = true) {
  return log3(opts, "info", label, message, newLine);
}
__name(info3, "info");
function warn3(opts, label, message, newLine = true) {
  return log3(opts, "warn", label, message, newLine);
}
__name(warn3, "warn");
function error3(opts, label, message, newLine = true) {
  return log3(opts, "error", label, message, newLine);
}
__name(error3, "error");
function debug3(...args) {
  if ("_astroGlobalDebug" in globalThis) {
    globalThis._astroGlobalDebug(...args);
  }
}
__name(debug3, "debug");
function getEventPrefix({ level, label }) {
  const timestamp = `${dateTimeFormat.format(/* @__PURE__ */ new Date())}`;
  const prefix = [];
  if (level === "error" || level === "warn") {
    prefix.push(bold(timestamp));
    prefix.push(`[${level.toUpperCase()}]`);
  } else {
    prefix.push(timestamp);
  }
  if (label) {
    prefix.push(`[${label}]`);
  }
  if (level === "error") {
    return red(prefix.join(" "));
  }
  if (level === "warn") {
    return yellow(prefix.join(" "));
  }
  if (prefix.length === 1) {
    return dim(prefix[0]);
  }
  return dim(prefix[0]) + " " + blue(prefix.splice(1).join(" "));
}
__name(getEventPrefix, "getEventPrefix");
var Logger = class {
  static {
    __name(this, "Logger");
  }
  options;
  constructor(options) {
    this.options = options;
  }
  info(label, message, newLine = true) {
    info3(this.options, label, message, newLine);
  }
  warn(label, message, newLine = true) {
    warn3(this.options, label, message, newLine);
  }
  error(label, message, newLine = true) {
    error3(this.options, label, message, newLine);
  }
  debug(label, ...messages) {
    debug3(label, ...messages);
  }
  level() {
    return this.options.level;
  }
  forkIntegrationLogger(label) {
    return new AstroIntegrationLogger(this.options, label);
  }
};
var AstroIntegrationLogger = class _AstroIntegrationLogger {
  static {
    __name(this, "AstroIntegrationLogger");
  }
  options;
  label;
  constructor(logging, label) {
    this.options = logging;
    this.label = label;
  }
  /**
   * Creates a new logger instance with a new label, but the same log options.
   */
  fork(label) {
    return new _AstroIntegrationLogger(this.options, label);
  }
  info(message) {
    info3(this.options, this.label, message);
  }
  warn(message) {
    warn3(this.options, this.label, message);
  }
  error(message) {
    error3(this.options, this.label, message);
  }
  debug(message) {
    debug3(this.label, message);
  }
};
var consoleLogDestination = {
  write(event) {
    let dest = console.error;
    if (levels[event.level] < levels["error"]) {
      dest = console.info;
    }
    if (event.label === "SKIP_FORMAT") {
      dest(event.message);
    } else {
      dest(getEventPrefix(event) + " " + event.message);
    }
    return true;
  }
};
function getAssetsPrefix(fileExtension2, assetsPrefix) {
  if (!assetsPrefix) return "";
  if (typeof assetsPrefix === "string") return assetsPrefix;
  const dotLessFileExtension = fileExtension2.slice(1);
  if (assetsPrefix[dotLessFileExtension]) {
    return assetsPrefix[dotLessFileExtension];
  }
  return assetsPrefix.fallback;
}
__name(getAssetsPrefix, "getAssetsPrefix");
function createAssetLink(href, base, assetsPrefix) {
  if (assetsPrefix) {
    const pf = getAssetsPrefix(fileExtension(href), assetsPrefix);
    return joinPaths(pf, slash(href));
  } else if (base) {
    return prependForwardSlash(joinPaths(base, slash(href)));
  } else {
    return href;
  }
}
__name(createAssetLink, "createAssetLink");
function createStylesheetElement(stylesheet, base, assetsPrefix) {
  if (stylesheet.type === "inline") {
    return {
      props: {},
      children: stylesheet.content
    };
  } else {
    return {
      props: {
        rel: "stylesheet",
        href: createAssetLink(stylesheet.src, base, assetsPrefix)
      },
      children: ""
    };
  }
}
__name(createStylesheetElement, "createStylesheetElement");
function createStylesheetElementSet(stylesheets, base, assetsPrefix) {
  return new Set(stylesheets.map((s) => createStylesheetElement(s, base, assetsPrefix)));
}
__name(createStylesheetElementSet, "createStylesheetElementSet");
function createModuleScriptElement(script, base, assetsPrefix) {
  if (script.type === "external") {
    return createModuleScriptElementWithSrc(script.value, base, assetsPrefix);
  } else {
    return {
      props: {
        type: "module"
      },
      children: script.value
    };
  }
}
__name(createModuleScriptElement, "createModuleScriptElement");
function createModuleScriptElementWithSrc(src, base, assetsPrefix) {
  return {
    props: {
      type: "module",
      src: createAssetLink(src, base, assetsPrefix)
    },
    children: ""
  };
}
__name(createModuleScriptElementWithSrc, "createModuleScriptElementWithSrc");
function redirectTemplate({
  status,
  absoluteLocation,
  relativeLocation,
  from
}) {
  const delay = status === 302 ? 2 : 0;
  return `<!doctype html>
<title>Redirecting to: ${relativeLocation}</title>
<meta http-equiv="refresh" content="${delay};url=${relativeLocation}">
<meta name="robots" content="noindex">
<link rel="canonical" href="${absoluteLocation}">
<body>
	<a href="${relativeLocation}">Redirecting ${from ? `from <code>${from}</code> ` : ""}to <code>${relativeLocation}</code></a>
</body>`;
}
__name(redirectTemplate, "redirectTemplate");
var AppPipeline = class _AppPipeline extends Pipeline {
  static {
    __name(this, "AppPipeline");
  }
  static create({
    logger,
    manifest: manifest2,
    runtimeMode,
    renderers: renderers2,
    resolve,
    serverLike,
    streaming,
    defaultRoutes
  }) {
    const pipeline = new _AppPipeline(
      logger,
      manifest2,
      runtimeMode,
      renderers2,
      resolve,
      serverLike,
      streaming,
      void 0,
      void 0,
      void 0,
      void 0,
      void 0,
      void 0,
      void 0,
      void 0,
      defaultRoutes
    );
    return pipeline;
  }
  headElements(routeData) {
    const routeInfo = this.manifest.routes.find((route) => route.routeData === routeData);
    const links = /* @__PURE__ */ new Set();
    const scripts = /* @__PURE__ */ new Set();
    const styles = createStylesheetElementSet(routeInfo?.styles ?? []);
    for (const script of routeInfo?.scripts ?? []) {
      if ("stage" in script) {
        if (script.stage === "head-inline") {
          scripts.add({
            props: {},
            children: script.children
          });
        }
      } else {
        scripts.add(createModuleScriptElement(script));
      }
    }
    return { links, styles, scripts };
  }
  componentMetadata() {
  }
  async getComponentByRoute(routeData) {
    const module = await this.getModuleForRoute(routeData);
    return module.page();
  }
  async tryRewrite(payload, request) {
    const { newUrl, pathname, routeData } = findRouteToRewrite({
      payload,
      request,
      routes: this.manifest?.routes.map((r2) => r2.routeData),
      trailingSlash: this.manifest.trailingSlash,
      buildFormat: this.manifest.buildFormat,
      base: this.manifest.base,
      outDir: this.serverLike ? this.manifest.buildClientDir : this.manifest.outDir
    });
    const componentInstance = await this.getComponentByRoute(routeData);
    return { newUrl, pathname, componentInstance, routeData };
  }
  async getModuleForRoute(route) {
    for (const defaultRoute of this.defaultRoutes) {
      if (route.component === defaultRoute.component) {
        return {
          page: /* @__PURE__ */ __name(() => Promise.resolve(defaultRoute.instance), "page"),
          renderers: []
        };
      }
    }
    if (route.type === "redirect") {
      return RedirectSinglePageBuiltModule;
    } else {
      if (this.manifest.pageMap) {
        const importComponentInstance = this.manifest.pageMap.get(route.component);
        if (!importComponentInstance) {
          throw new Error(
            `Unexpectedly unable to find a component instance for route ${route.route}`
          );
        }
        return await importComponentInstance();
      } else if (this.manifest.pageModule) {
        return this.manifest.pageModule;
      }
      throw new Error(
        "Astro couldn't find the correct page to render, probably because it wasn't correctly mapped for SSR usage. This is an internal error, please file an issue."
      );
    }
  }
};
var App = class _App {
  static {
    __name(this, "App");
  }
  #manifest;
  #manifestData;
  #logger = new Logger({
    dest: consoleLogDestination,
    level: "info"
  });
  #baseWithoutTrailingSlash;
  #pipeline;
  #adapterLogger;
  constructor(manifest2, streaming = true) {
    this.#manifest = manifest2;
    this.#manifestData = {
      routes: manifest2.routes.map((route) => route.routeData)
    };
    ensure404Route(this.#manifestData);
    this.#baseWithoutTrailingSlash = removeTrailingForwardSlash(this.#manifest.base);
    this.#pipeline = this.#createPipeline(streaming);
    this.#adapterLogger = new AstroIntegrationLogger(
      this.#logger.options,
      this.#manifest.adapterName
    );
  }
  getAdapterLogger() {
    return this.#adapterLogger;
  }
  /**
   * Creates a pipeline by reading the stored manifest
   *
   * @param streaming
   * @private
   */
  #createPipeline(streaming = false) {
    return AppPipeline.create({
      logger: this.#logger,
      manifest: this.#manifest,
      runtimeMode: "production",
      renderers: this.#manifest.renderers,
      defaultRoutes: createDefaultRoutes(this.#manifest),
      resolve: /* @__PURE__ */ __name(async (specifier) => {
        if (!(specifier in this.#manifest.entryModules)) {
          throw new Error(`Unable to resolve [${specifier}]`);
        }
        const bundlePath = this.#manifest.entryModules[specifier];
        if (bundlePath.startsWith("data:") || bundlePath.length === 0) {
          return bundlePath;
        } else {
          return createAssetLink(bundlePath, this.#manifest.base, this.#manifest.assetsPrefix);
        }
      }, "resolve"),
      serverLike: true,
      streaming
    });
  }
  set setManifestData(newManifestData) {
    this.#manifestData = newManifestData;
  }
  removeBase(pathname) {
    if (pathname.startsWith(this.#manifest.base)) {
      return pathname.slice(this.#baseWithoutTrailingSlash.length + 1);
    }
    return pathname;
  }
  /**
   * It removes the base from the request URL, prepends it with a forward slash and attempts to decoded it.
   *
   * If the decoding fails, it logs the error and return the pathname as is.
   * @param request
   * @private
   */
  #getPathnameFromRequest(request) {
    const url = new URL(request.url);
    const pathname = prependForwardSlash(this.removeBase(url.pathname));
    try {
      return decodeURI(pathname);
    } catch (e) {
      this.getAdapterLogger().error(e.toString());
      return pathname;
    }
  }
  /**
   * Given a `Request`, it returns the `RouteData` that matches its `pathname`. By default, prerendered
   * routes aren't returned, even if they are matched.
   *
   * When `allowPrerenderedRoutes` is `true`, the function returns matched prerendered routes too.
   * @param request
   * @param allowPrerenderedRoutes
   */
  match(request, allowPrerenderedRoutes = false) {
    const url = new URL(request.url);
    if (this.#manifest.assets.has(url.pathname)) return void 0;
    let pathname = this.#computePathnameFromDomain(request);
    if (!pathname) {
      pathname = prependForwardSlash(this.removeBase(url.pathname));
    }
    let routeData = matchRoute(decodeURI(pathname), this.#manifestData);
    if (!routeData) return void 0;
    if (allowPrerenderedRoutes) {
      return routeData;
    } else if (routeData.prerender) {
      return void 0;
    }
    return routeData;
  }
  #computePathnameFromDomain(request) {
    let pathname = void 0;
    const url = new URL(request.url);
    if (this.#manifest.i18n && (this.#manifest.i18n.strategy === "domains-prefix-always" || this.#manifest.i18n.strategy === "domains-prefix-other-locales" || this.#manifest.i18n.strategy === "domains-prefix-always-no-redirect")) {
      let host = request.headers.get("X-Forwarded-Host");
      let protocol = request.headers.get("X-Forwarded-Proto");
      if (protocol) {
        protocol = protocol + ":";
      } else {
        protocol = url.protocol;
      }
      if (!host) {
        host = request.headers.get("Host");
      }
      if (host && protocol) {
        host = host.split(":")[0];
        try {
          let locale;
          const hostAsUrl = new URL(`${protocol}//${host}`);
          for (const [domainKey, localeValue] of Object.entries(
            this.#manifest.i18n.domainLookupTable
          )) {
            const domainKeyAsUrl = new URL(domainKey);
            if (hostAsUrl.host === domainKeyAsUrl.host && hostAsUrl.protocol === domainKeyAsUrl.protocol) {
              locale = localeValue;
              break;
            }
          }
          if (locale) {
            pathname = prependForwardSlash(
              joinPaths(normalizeTheLocale(locale), this.removeBase(url.pathname))
            );
            if (url.pathname.endsWith("/")) {
              pathname = appendForwardSlash(pathname);
            }
          }
        } catch (e) {
          this.#logger.error(
            "router",
            `Astro tried to parse ${protocol}//${host} as an URL, but it threw a parsing error. Check the X-Forwarded-Host and X-Forwarded-Proto headers.`
          );
          this.#logger.error("router", `Error: ${e}`);
        }
      }
    }
    return pathname;
  }
  #redirectTrailingSlash(pathname) {
    const { trailingSlash } = this.#manifest;
    if (pathname === "/" || isInternalPath(pathname)) {
      return pathname;
    }
    const path = collapseDuplicateTrailingSlashes(pathname, trailingSlash !== "never");
    if (path !== pathname) {
      return path;
    }
    if (trailingSlash === "ignore") {
      return pathname;
    }
    if (trailingSlash === "always" && !hasFileExtension(pathname)) {
      return appendForwardSlash(pathname);
    }
    if (trailingSlash === "never") {
      return removeTrailingForwardSlash(pathname);
    }
    return pathname;
  }
  async render(request, renderOptions) {
    let routeData;
    let locals;
    let clientAddress;
    let addCookieHeader;
    const url = new URL(request.url);
    const redirect = this.#redirectTrailingSlash(url.pathname);
    const prerenderedErrorPageFetch = renderOptions?.prerenderedErrorPageFetch ?? fetch;
    if (redirect !== url.pathname) {
      const status = request.method === "GET" ? 301 : 308;
      return new Response(
        redirectTemplate({
          status,
          relativeLocation: url.pathname,
          absoluteLocation: redirect,
          from: request.url
        }),
        {
          status,
          headers: {
            location: redirect + url.search
          }
        }
      );
    }
    addCookieHeader = renderOptions?.addCookieHeader;
    clientAddress = renderOptions?.clientAddress ?? Reflect.get(request, clientAddressSymbol);
    routeData = renderOptions?.routeData;
    locals = renderOptions?.locals;
    if (routeData) {
      this.#logger.debug(
        "router",
        "The adapter " + this.#manifest.adapterName + " provided a custom RouteData for ",
        request.url
      );
      this.#logger.debug("router", "RouteData:\n" + routeData);
    }
    if (locals) {
      if (typeof locals !== "object") {
        const error4 = new AstroError(LocalsNotAnObject);
        this.#logger.error(null, error4.stack);
        return this.#renderError(request, {
          status: 500,
          error: error4,
          clientAddress,
          prerenderedErrorPageFetch
        });
      }
    }
    if (!routeData) {
      routeData = this.match(request);
      this.#logger.debug("router", "Astro matched the following route for " + request.url);
      this.#logger.debug("router", "RouteData:\n" + routeData);
    }
    if (!routeData) {
      routeData = this.#manifestData.routes.find(
        (route) => route.component === "404.astro" || route.component === DEFAULT_404_COMPONENT
      );
    }
    if (!routeData) {
      this.#logger.debug("router", "Astro hasn't found routes that match " + request.url);
      this.#logger.debug("router", "Here's the available routes:\n", this.#manifestData);
      return this.#renderError(request, {
        locals,
        status: 404,
        clientAddress,
        prerenderedErrorPageFetch
      });
    }
    const pathname = this.#getPathnameFromRequest(request);
    const defaultStatus = this.#getDefaultStatusCode(routeData, pathname);
    let response;
    let session;
    try {
      const mod = await this.#pipeline.getModuleForRoute(routeData);
      const renderContext = await RenderContext.create({
        pipeline: this.#pipeline,
        locals,
        pathname,
        request,
        routeData,
        status: defaultStatus,
        clientAddress
      });
      session = renderContext.session;
      response = await renderContext.render(await mod.page());
    } catch (err) {
      this.#logger.error(null, err.stack || err.message || String(err));
      return this.#renderError(request, {
        locals,
        status: 500,
        error: err,
        clientAddress,
        prerenderedErrorPageFetch
      });
    } finally {
      await session?.[PERSIST_SYMBOL]();
    }
    if (REROUTABLE_STATUS_CODES.includes(response.status) && response.headers.get(REROUTE_DIRECTIVE_HEADER) !== "no") {
      return this.#renderError(request, {
        locals,
        response,
        status: response.status,
        // We don't have an error to report here. Passing null means we pass nothing intentionally
        // while undefined means there's no error
        error: response.status === 500 ? null : void 0,
        clientAddress,
        prerenderedErrorPageFetch
      });
    }
    if (response.headers.has(REROUTE_DIRECTIVE_HEADER)) {
      response.headers.delete(REROUTE_DIRECTIVE_HEADER);
    }
    if (addCookieHeader) {
      for (const setCookieHeaderValue of _App.getSetCookieFromResponse(response)) {
        response.headers.append("set-cookie", setCookieHeaderValue);
      }
    }
    Reflect.set(response, responseSentSymbol, true);
    return response;
  }
  setCookieHeaders(response) {
    return getSetCookiesFromResponse(response);
  }
  /**
   * Reads all the cookies written by `Astro.cookie.set()` onto the passed response.
   * For example,
   * ```ts
   * for (const cookie_ of App.getSetCookieFromResponse(response)) {
   *     const cookie: string = cookie_
   * }
   * ```
   * @param response The response to read cookies from.
   * @returns An iterator that yields key-value pairs as equal-sign-separated strings.
   */
  static getSetCookieFromResponse = getSetCookiesFromResponse;
  /**
   * If it is a known error code, try sending the according page (e.g. 404.astro / 500.astro).
   * This also handles pre-rendered /404 or /500 routes
   */
  async #renderError(request, {
    locals,
    status,
    response: originalResponse,
    skipMiddleware = false,
    error: error4,
    clientAddress,
    prerenderedErrorPageFetch
  }) {
    const errorRoutePath = `/${status}${this.#manifest.trailingSlash === "always" ? "/" : ""}`;
    const errorRouteData = matchRoute(errorRoutePath, this.#manifestData);
    const url = new URL(request.url);
    if (errorRouteData) {
      if (errorRouteData.prerender) {
        const maybeDotHtml = errorRouteData.route.endsWith(`/${status}`) ? ".html" : "";
        const statusURL = new URL(
          `${this.#baseWithoutTrailingSlash}/${status}${maybeDotHtml}`,
          url
        );
        if (statusURL.toString() !== request.url) {
          const response2 = await prerenderedErrorPageFetch(statusURL.toString());
          const override = { status, removeContentEncodingHeaders: true };
          return this.#mergeResponses(response2, originalResponse, override);
        }
      }
      const mod = await this.#pipeline.getModuleForRoute(errorRouteData);
      let session;
      try {
        const renderContext = await RenderContext.create({
          locals,
          pipeline: this.#pipeline,
          middleware: skipMiddleware ? NOOP_MIDDLEWARE_FN : void 0,
          pathname: this.#getPathnameFromRequest(request),
          request,
          routeData: errorRouteData,
          status,
          props: { error: error4 },
          clientAddress
        });
        session = renderContext.session;
        const response2 = await renderContext.render(await mod.page());
        return this.#mergeResponses(response2, originalResponse);
      } catch {
        if (skipMiddleware === false) {
          return this.#renderError(request, {
            locals,
            status,
            response: originalResponse,
            skipMiddleware: true,
            clientAddress,
            prerenderedErrorPageFetch
          });
        }
      } finally {
        await session?.[PERSIST_SYMBOL]();
      }
    }
    const response = this.#mergeResponses(new Response(null, { status }), originalResponse);
    Reflect.set(response, responseSentSymbol, true);
    return response;
  }
  #mergeResponses(newResponse, originalResponse, override) {
    let newResponseHeaders = newResponse.headers;
    if (override?.removeContentEncodingHeaders) {
      newResponseHeaders = new Headers(newResponseHeaders);
      newResponseHeaders.delete("Content-Encoding");
      newResponseHeaders.delete("Content-Length");
    }
    if (!originalResponse) {
      if (override !== void 0) {
        return new Response(newResponse.body, {
          status: override.status,
          statusText: newResponse.statusText,
          headers: newResponseHeaders
        });
      }
      return newResponse;
    }
    const status = override?.status ? override.status : originalResponse.status === 200 ? newResponse.status : originalResponse.status;
    try {
      originalResponse.headers.delete("Content-type");
    } catch {
    }
    const mergedHeaders = new Map([
      ...Array.from(newResponseHeaders),
      ...Array.from(originalResponse.headers)
    ]);
    const newHeaders = new Headers();
    for (const [name, value] of mergedHeaders) {
      newHeaders.set(name, value);
    }
    return new Response(newResponse.body, {
      status,
      statusText: status === 200 ? newResponse.statusText : originalResponse.statusText,
      // If you're looking at here for possible bugs, it means that it's not a bug.
      // With the middleware, users can meddle with headers, and we should pass to the 404/500.
      // If users see something weird, it's because they are setting some headers they should not.
      //
      // Although, we don't want it to replace the content-type, because the error page must return `text/html`
      headers: newHeaders
    });
  }
  #getDefaultStatusCode(routeData, pathname) {
    if (!routeData.pattern.test(pathname)) {
      for (const fallbackRoute of routeData.fallbackRoutes) {
        if (fallbackRoute.pattern.test(pathname)) {
          return 302;
        }
      }
    }
    const route = removeTrailingForwardSlash(routeData.route);
    if (route.endsWith("/404")) return 404;
    if (route.endsWith("/500")) return 500;
    return 200;
  }
};
async function handle(manifest2, app, request, env2, context2) {
  const { pathname } = new URL(request.url);
  const bindingName = "SESSION";
  globalThis.__env__ ??= {};
  globalThis.__env__[bindingName] = env2[bindingName];
  if (manifest2.assets.has(pathname)) {
    return env2.ASSETS.fetch(request.url.replace(/\.html$/, ""));
  }
  const routeData = app.match(request);
  if (!routeData) {
    const asset = await env2.ASSETS.fetch(
      request.url.replace(/index.html$/, "").replace(/\.html$/, "")
    );
    if (asset.status !== 404) {
      return asset;
    }
  }
  Reflect.set(request, Symbol.for("astro.clientAddress"), request.headers.get("cf-connecting-ip"));
  const locals = {
    runtime: {
      env: env2,
      cf: request.cf,
      caches,
      ctx: {
        waitUntil: /* @__PURE__ */ __name((promise) => context2.waitUntil(promise), "waitUntil"),
        // Currently not available: https://developers.cloudflare.com/pages/platform/known-issues/#pages-functions
        passThroughOnException: /* @__PURE__ */ __name(() => {
          throw new Error(
            "`passThroughOnException` is currently not available in Cloudflare Pages. See https://developers.cloudflare.com/pages/platform/known-issues/#pages-functions."
          );
        }, "passThroughOnException"),
        props: {}
      }
    }
  };
  const response = await app.render(
    request,
    {
      routeData,
      locals,
      prerenderedErrorPageFetch: /* @__PURE__ */ __name(async (url) => {
        return env2.ASSETS.fetch(url.replace(/\.html$/, ""));
      }, "prerenderedErrorPageFetch")
    }
  );
  if (app.setCookieHeaders) {
    for (const setCookieHeader of app.setCookieHeaders(response)) {
      response.headers.append("Set-Cookie", setCookieHeader);
    }
  }
  return response;
}
__name(handle, "handle");
function createExports(manifest2) {
  const app = new App(manifest2);
  const fetch2 = /* @__PURE__ */ __name(async (request, env2, context2) => {
    return await handle(manifest2, app, request, env2, context2);
  }, "fetch");
  return { default: { fetch: fetch2 } };
}
__name(createExports, "createExports");
var serverEntrypointModule = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  createExports
}, Symbol.toStringTag, { value: "Module" }));

// dist/_worker.js/manifest_CNuFR5LO.mjs
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
init_server_BRKsKzpO();
init_astro_designed_error_pages_zET6Ym84();
globalThis.process ??= {};
globalThis.process.env ??= {};
function sanitizeParams(params) {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => {
      if (typeof value === "string") {
        return [key, value.normalize().replace(/#/g, "%23").replace(/\?/g, "%3F")];
      }
      return [key, value];
    })
  );
}
__name(sanitizeParams, "sanitizeParams");
function getParameter(part, params) {
  if (part.spread) {
    return params[part.content.slice(3)] || "";
  }
  if (part.dynamic) {
    if (!params[part.content]) {
      throw new TypeError(`Missing parameter: ${part.content}`);
    }
    return params[part.content];
  }
  return part.content.normalize().replace(/\?/g, "%3F").replace(/#/g, "%23").replace(/%5B/g, "[").replace(/%5D/g, "]");
}
__name(getParameter, "getParameter");
function getSegment(segment, params) {
  const segmentPath = segment.map((part) => getParameter(part, params)).join("");
  return segmentPath ? "/" + segmentPath : "";
}
__name(getSegment, "getSegment");
function getRouteGenerator(segments, addTrailingSlash) {
  return (params) => {
    const sanitizedParams = sanitizeParams(params);
    let trailing = "";
    if (addTrailingSlash === "always" && segments.length) {
      trailing = "/";
    }
    const path = segments.map((segment) => getSegment(segment, sanitizedParams)).join("") + trailing;
    return path || "/";
  };
}
__name(getRouteGenerator, "getRouteGenerator");
function deserializeRouteData(rawRouteData) {
  return {
    route: rawRouteData.route,
    type: rawRouteData.type,
    pattern: new RegExp(rawRouteData.pattern),
    params: rawRouteData.params,
    component: rawRouteData.component,
    generate: getRouteGenerator(rawRouteData.segments, rawRouteData._meta.trailingSlash),
    pathname: rawRouteData.pathname || void 0,
    segments: rawRouteData.segments,
    prerender: rawRouteData.prerender,
    redirect: rawRouteData.redirect,
    redirectRoute: rawRouteData.redirectRoute ? deserializeRouteData(rawRouteData.redirectRoute) : void 0,
    fallbackRoutes: rawRouteData.fallbackRoutes.map((fallback) => {
      return deserializeRouteData(fallback);
    }),
    isIndex: rawRouteData.isIndex,
    origin: rawRouteData.origin
  };
}
__name(deserializeRouteData, "deserializeRouteData");
function deserializeManifest(serializedManifest) {
  const routes = [];
  for (const serializedRoute of serializedManifest.routes) {
    routes.push({
      ...serializedRoute,
      routeData: deserializeRouteData(serializedRoute.routeData)
    });
    const route = serializedRoute;
    route.routeData = deserializeRouteData(serializedRoute.routeData);
  }
  const assets = new Set(serializedManifest.assets);
  const componentMetadata = new Map(serializedManifest.componentMetadata);
  const inlinedScripts = new Map(serializedManifest.inlinedScripts);
  const clientDirectives = new Map(serializedManifest.clientDirectives);
  const serverIslandNameMap = new Map(serializedManifest.serverIslandNameMap);
  const key = decodeKey(serializedManifest.key);
  return {
    // in case user middleware exists, this no-op middleware will be reassigned (see plugin-ssr.ts)
    middleware() {
      return { onRequest: NOOP_MIDDLEWARE_FN };
    },
    ...serializedManifest,
    assets,
    componentMetadata,
    inlinedScripts,
    clientDirectives,
    routes,
    serverIslandNameMap,
    key
  };
}
__name(deserializeManifest, "deserializeManifest");
var manifest = deserializeManifest({ "hrefRoot": "file:///Volumes/MannyKnows/MK/MannyKnows/", "cacheDir": "file:///Volumes/MannyKnows/MK/MannyKnows/node_modules/.astro/", "outDir": "file:///Volumes/MannyKnows/MK/MannyKnows/dist/", "srcDir": "file:///Volumes/MannyKnows/MK/MannyKnows/src/", "publicDir": "file:///Volumes/MannyKnows/MK/MannyKnows/public/", "buildClientDir": "file:///Volumes/MannyKnows/MK/MannyKnows/dist/", "buildServerDir": "file:///Volumes/MannyKnows/MK/MannyKnows/dist/_worker.js/", "adapterName": "@astrojs/cloudflare", "routes": [{ "file": "", "links": [], "scripts": [], "styles": [], "routeData": { "type": "page", "component": "_server-islands.astro", "params": ["name"], "segments": [[{ "content": "_server-islands", "dynamic": false, "spread": false }], [{ "content": "name", "dynamic": true, "spread": false }]], "pattern": "^\\/_server-islands\\/([^/]+?)\\/?$", "prerender": false, "isIndex": false, "fallbackRoutes": [], "route": "/_server-islands/[name]", "origin": "internal", "_meta": { "trailingSlash": "ignore" } } }, { "file": "", "links": [], "scripts": [], "styles": [], "routeData": { "type": "endpoint", "isIndex": false, "route": "/_image", "pattern": "^\\/_image\\/?$", "segments": [[{ "content": "_image", "dynamic": false, "spread": false }]], "params": [], "component": "node_modules/@astrojs/cloudflare/dist/entrypoints/image-endpoint.js", "pathname": "/_image", "prerender": false, "fallbackRoutes": [], "origin": "internal", "_meta": { "trailingSlash": "ignore" } } }, { "file": "", "links": [], "scripts": [], "styles": [{ "type": "external", "src": "/_astro/index.B_RJBm-w.css" }], "routeData": { "route": "/404", "isIndex": false, "type": "page", "pattern": "^\\/404\\/?$", "segments": [[{ "content": "404", "dynamic": false, "spread": false }]], "params": [], "component": "src/pages/404.astro", "pathname": "/404", "prerender": false, "fallbackRoutes": [], "distURL": [], "origin": "project", "_meta": { "trailingSlash": "ignore" } } }, { "file": "", "links": [], "scripts": [], "styles": [], "routeData": { "route": "/api/calendar-health", "isIndex": false, "type": "endpoint", "pattern": "^\\/api\\/calendar-health\\/?$", "segments": [[{ "content": "api", "dynamic": false, "spread": false }], [{ "content": "calendar-health", "dynamic": false, "spread": false }]], "params": [], "component": "src/pages/api/calendar-health.ts", "pathname": "/api/calendar-health", "prerender": false, "fallbackRoutes": [], "distURL": [], "origin": "project", "_meta": { "trailingSlash": "ignore" } } }, { "file": "", "links": [], "scripts": [], "styles": [], "routeData": { "route": "/api/chat", "isIndex": false, "type": "endpoint", "pattern": "^\\/api\\/chat\\/?$", "segments": [[{ "content": "api", "dynamic": false, "spread": false }], [{ "content": "chat", "dynamic": false, "spread": false }]], "params": [], "component": "src/pages/api/chat.ts", "pathname": "/api/chat", "prerender": false, "fallbackRoutes": [], "distURL": [], "origin": "project", "_meta": { "trailingSlash": "ignore" } } }, { "file": "", "links": [], "scripts": [], "styles": [], "routeData": { "route": "/api/kv-analysis", "isIndex": false, "type": "endpoint", "pattern": "^\\/api\\/kv-analysis\\/?$", "segments": [[{ "content": "api", "dynamic": false, "spread": false }], [{ "content": "kv-analysis", "dynamic": false, "spread": false }]], "params": [], "component": "src/pages/api/kv-analysis.ts", "pathname": "/api/kv-analysis", "prerender": false, "fallbackRoutes": [], "distURL": [], "origin": "project", "_meta": { "trailingSlash": "ignore" } } }, { "file": "", "links": [], "scripts": [], "styles": [], "routeData": { "route": "/api/security-status", "isIndex": false, "type": "endpoint", "pattern": "^\\/api\\/security-status\\/?$", "segments": [[{ "content": "api", "dynamic": false, "spread": false }], [{ "content": "security-status", "dynamic": false, "spread": false }]], "params": [], "component": "src/pages/api/security-status.ts", "pathname": "/api/security-status", "prerender": false, "fallbackRoutes": [], "distURL": [], "origin": "project", "_meta": { "trailingSlash": "ignore" } } }, { "file": "", "links": [], "scripts": [], "styles": [], "routeData": { "route": "/api/verify-meeting-action", "isIndex": false, "type": "endpoint", "pattern": "^\\/api\\/verify-meeting-action\\/?$", "segments": [[{ "content": "api", "dynamic": false, "spread": false }], [{ "content": "verify-meeting-action", "dynamic": false, "spread": false }]], "params": [], "component": "src/pages/api/verify-meeting-action.ts", "pathname": "/api/verify-meeting-action", "prerender": false, "fallbackRoutes": [], "distURL": [], "origin": "project", "_meta": { "trailingSlash": "ignore" } } }, { "file": "", "links": [], "scripts": [], "styles": [{ "type": "external", "src": "/_astro/index.B_RJBm-w.css" }, { "type": "external", "src": "/_astro/index.Clx7WlIp.css" }], "routeData": { "route": "/", "isIndex": true, "type": "page", "pattern": "^\\/$", "segments": [], "params": [], "component": "src/pages/index.astro", "pathname": "/", "prerender": false, "fallbackRoutes": [], "distURL": [], "origin": "project", "_meta": { "trailingSlash": "ignore" } } }], "base": "/", "trailingSlash": "ignore", "compressHTML": true, "componentMetadata": [["/Volumes/MannyKnows/MK/MannyKnows/src/pages/404.astro", { "propagation": "none", "containsHead": true }], ["/Volumes/MannyKnows/MK/MannyKnows/src/pages/index.astro", { "propagation": "none", "containsHead": true }]], "renderers": [], "clientDirectives": [["idle", '(()=>{var l=(n,t)=>{let i=async()=>{await(await n())()},e=typeof t.value=="object"?t.value:void 0,s={timeout:e==null?void 0:e.timeout};"requestIdleCallback"in window?window.requestIdleCallback(i,s):setTimeout(i,s.timeout||200)};(self.Astro||(self.Astro={})).idle=l;window.dispatchEvent(new Event("astro:idle"));})();'], ["load", '(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).load=e;window.dispatchEvent(new Event("astro:load"));})();'], ["media", '(()=>{var n=(a,t)=>{let i=async()=>{await(await a())()};if(t.value){let e=matchMedia(t.value);e.matches?i():e.addEventListener("change",i,{once:!0})}};(self.Astro||(self.Astro={})).media=n;window.dispatchEvent(new Event("astro:media"));})();'], ["only", '(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).only=e;window.dispatchEvent(new Event("astro:only"));})();'], ["visible", '(()=>{var a=(s,i,o)=>{let r=async()=>{await(await s())()},t=typeof i.value=="object"?i.value:void 0,c={rootMargin:t==null?void 0:t.rootMargin},n=new IntersectionObserver(e=>{for(let l of e)if(l.isIntersecting){n.disconnect(),r();break}},c);for(let e of o.children)n.observe(e)};(self.Astro||(self.Astro={})).visible=a;window.dispatchEvent(new Event("astro:visible"));})();']], "entryModules": { "\0astro-internal:middleware": "_astro-internal_middleware.mjs", "\0noop-actions": "_noop-actions.mjs", "\0@astro-page:node_modules/@astrojs/cloudflare/dist/entrypoints/image-endpoint@_@js": "pages/_image.astro.mjs", "\0@astro-page:src/pages/404@_@astro": "pages/404.astro.mjs", "\0@astro-page:src/pages/api/calendar-health@_@ts": "pages/api/calendar-health.astro.mjs", "\0@astro-page:src/pages/api/chat@_@ts": "pages/api/chat.astro.mjs", "\0@astro-page:src/pages/api/kv-analysis@_@ts": "pages/api/kv-analysis.astro.mjs", "\0@astro-page:src/pages/api/security-status@_@ts": "pages/api/security-status.astro.mjs", "\0@astro-page:src/pages/api/verify-meeting-action@_@ts": "pages/api/verify-meeting-action.astro.mjs", "\0@astro-page:src/pages/index@_@astro": "pages/index.astro.mjs", "\0@astrojs-ssr-virtual-entry": "index.js", "\0@astro-renderers": "renderers.mjs", "\0@astrojs-ssr-adapter": "_@astrojs-ssr-adapter.mjs", "\0@astrojs-manifest": "manifest_CNuFR5LO.mjs", "/Volumes/MannyKnows/MK/MannyKnows/node_modules/unstorage/drivers/cloudflare-kv-binding.mjs": "chunks/cloudflare-kv-binding_DMly_2Gl.mjs", "/Volumes/MannyKnows/MK/MannyKnows/src/layouts/BaseLayout.astro?astro&type=script&index=0&lang.ts": "_astro/BaseLayout.astro_astro_type_script_index_0_lang.BEBGZ7DO.js", "/Volumes/MannyKnows/MK/MannyKnows/src/components/navigation/DockMenu.astro?astro&type=script&index=0&lang.ts": "_astro/DockMenu.astro_astro_type_script_index_0_lang.BNF0tPpM.js", "/Volumes/MannyKnows/MK/MannyKnows/src/components/ui/ChatBox.astro?astro&type=script&index=0&lang.ts": "_astro/ChatBox.astro_astro_type_script_index_0_lang.qAfX_Kxj.js", "/Volumes/MannyKnows/MK/MannyKnows/src/components/sections/ReviewsSection.astro?astro&type=script&index=0&lang.ts": "_astro/ReviewsSection.astro_astro_type_script_index_0_lang.BJhG34ZN.js", "/Volumes/MannyKnows/MK/MannyKnows/src/components/sections/processsectionalt.astro?astro&type=script&index=0&lang.ts": "_astro/processsectionalt.astro_astro_type_script_index_0_lang.BWEw887D.js", "/Volumes/MannyKnows/MK/MannyKnows/src/components/settingsmodal.astro?astro&type=script&index=0&lang.ts": "_astro/settingsmodal.astro_astro_type_script_index_0_lang.C_2CPT3b.js", "astro:scripts/before-hydration.js": "" }, "inlinedScripts": [["/Volumes/MannyKnows/MK/MannyKnows/src/layouts/BaseLayout.astro?astro&type=script&index=0&lang.ts", 'window.addEventListener("load",()=>{const e=document.createElement("script");e.type="module",e.src="/pixel-canvas.js",document.head.appendChild(e)});'], ["/Volumes/MannyKnows/MK/MannyKnows/src/components/navigation/DockMenu.astro?astro&type=script&index=0&lang.ts", 'function o(){const e=document.getElementById("topNav"),t=document.getElementById("floatingDock");if(!e||!t){t&&setTimeout(()=>{t.classList.remove("translate-y-full","opacity-0"),t.classList.add("translate-y-0","opacity-100")},1e3);return}t.classList.add("translate-y-full","opacity-0"),new IntersectionObserver(n=>{n.forEach(l=>{l.isIntersecting?(t.classList.add("translate-y-full","opacity-0"),t.classList.remove("translate-y-0","opacity-100")):(t.classList.remove("translate-y-full","opacity-0"),t.classList.add("translate-y-0","opacity-100"))})},{threshold:.1,rootMargin:"-10px 0px"}).observe(e),document.getElementById("dockChatToggle");const s=document.getElementById("dockMenuToggle"),a=document.getElementById("mobile-menu-toggle");s&&a&&s.addEventListener("click",()=>{a.click()})}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",o,{passive:!0}):o();setTimeout(()=>{const e=document.getElementById("floatingDock");e&&e.classList.contains("translate-y-full")&&(e.classList.remove("translate-y-full","opacity-0"),e.classList.add("translate-y-0","opacity-100"))},3e3);'], ["/Volumes/MannyKnows/MK/MannyKnows/src/components/sections/ReviewsSection.astro?astro&type=script&index=0&lang.ts", 'function b(){const n=document.getElementById("reviewsContainerMobile"),s=document.getElementById("reviewsContainer"),y=document.getElementById("prevReview"),D=document.getElementById("nextReview"),E=document.getElementById("reviews-section");if(!y||!D||!E)return;let l=0,c=0,o=0,a=0,r=!1,u=0;function m(){if(!n)return;const t=n.children[0]?.offsetWidth||0,i=-l*t;n.style.transform=`translateX(${i}px)`}function h(){if(!s)return;const e=s.children[0],t=e?e.offsetWidth+32:0,i=-c*t;s.style.transform=`translateX(${i}px)`}function v(){if(window.innerWidth<768&&n){const t=n.children.length;l=(l+1)%t,m()}else if(s){const t=s.children.length,i=Math.max(0,t-3);c=c>=i?0:c+1,h()}}function p(){if(window.innerWidth<768&&n){const t=n.children.length;l=l===0?t-1:l-1,m()}else if(s){const t=s.children.length,i=Math.max(0,t-3);c=c<=0?i:c-1,h()}}function w(){window.innerWidth<768?m():h()}function X(){n&&(n.addEventListener("touchstart",e=>{o=e.touches[0].clientX,a=o,r=!0,u=Date.now(),n.style.transition="none"},{passive:!0}),n.addEventListener("touchmove",e=>{if(!r)return;a=e.touches[0].clientX;const t=a-o,i=-l*n.children[0]?.offsetWidth||0;n.style.transform=`translateX(${i+t}px)`},{passive:!0}),n.addEventListener("touchend",e=>{if(!r)return;r=!1,n.style.transition="transform 0.3s ease-out";const t=a-o,i=50,d=Date.now()-u,f=Math.abs(t)/d;Math.abs(t)>i||f>.5?t>0?p():v():m()},{passive:!0}),n.addEventListener("mousedown",e=>{o=e.clientX,a=o,r=!0,u=Date.now(),n.style.transition="none",e.preventDefault()}),n.addEventListener("mousemove",e=>{if(!r)return;a=e.clientX;const t=a-o,i=-l*n.children[0]?.offsetWidth||0;n.style.transform=`translateX(${i+t}px)`,e.preventDefault()}),n.addEventListener("mouseup",e=>{if(!r)return;r=!1,n.style.transition="transform 0.3s ease-out";const t=a-o,i=50,d=Date.now()-u,f=Math.abs(t)/d;Math.abs(t)>i||f>.5?t>0?p():v():m(),e.preventDefault()}),n.addEventListener("contextmenu",e=>{e.preventDefault()}))}function g(){s&&(s.addEventListener("mousedown",e=>{o=e.clientX,a=o,r=!0,u=Date.now(),s.style.transition="none",s.style.cursor="grabbing",e.preventDefault()}),document.addEventListener("mousemove",e=>{if(!r)return;a=e.clientX;const t=a-o,i=s.children[0],d=i?i.offsetWidth+32:400,f=-c*d;s.style.transform=`translateX(${f+t}px)`,e.preventDefault()}),document.addEventListener("mouseup",e=>{if(!r)return;r=!1,s.style.transition="transform 0.5s ease-in-out",s.style.cursor="grab";const t=a-o,i=30,d=Date.now()-u,f=Math.abs(t)/d;Math.abs(t)>i||f>.3?t>0?p():v():h(),e.preventDefault()}),s.addEventListener("mouseleave",e=>{r&&(r=!1,s.style.transition="transform 0.5s ease-in-out",s.style.cursor="grab",h())}),s.addEventListener("contextmenu",e=>{e.preventDefault()}),s.style.cursor="grab")}D.addEventListener("click",v),y.addEventListener("click",p),w(),X(),g(),window.addEventListener("resize",()=>{w()})}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",b):b();'], ["/Volumes/MannyKnows/MK/MannyKnows/src/components/sections/processsectionalt.astro?astro&type=script&index=0&lang.ts", 'document.addEventListener("DOMContentLoaded",function(){const p=navigator.userAgent.indexOf("Windows")!==-1;CSS.supports("backdrop-filter","blur(20px)")||CSS.supports("-webkit-backdrop-filter","blur(20px)"),CSS.supports("will-change","transform");const u=document.querySelectorAll("[data-target-step]"),l=document.querySelectorAll(".process-card"),f=document.querySelectorAll(".process-card-wrapper"),c=["#10d1ff","#0071e3","#3b5bd6","#5856d6","#a855f7","#ec4899"];f.forEach((e,t)=>{e instanceof HTMLElement&&e.style.setProperty("--step-color",c[t])});function s(e,t){if(e instanceof HTMLElement)try{t.transform&&e.style.setProperty("transform",t.transform,"important"),t.brightness&&(p&&!CSS.supports("filter","brightness(1.2)")?e.style.setProperty("opacity","0.9","important"):e.style.setProperty("filter",`brightness(${t.brightness})`,"important")),t.boxShadow&&e.style.setProperty("box-shadow",t.boxShadow,"important"),t.borderColor&&e.style.setProperty("border-color",t.borderColor,"important")}catch{}}function n(e){if(e instanceof HTMLElement)try{e.style.removeProperty("transform"),e.style.removeProperty("filter"),e.style.removeProperty("opacity"),e.style.removeProperty("box-shadow"),e.style.removeProperty("border-color")}catch{}}l.forEach((e,t)=>{if(!(e instanceof HTMLElement))return;const r=e.getAttribute("data-step-index");if(!r)return;const o=c[parseInt(r)],i=`0 0 40px ${o}30, 0 0 20px ${o}20, 0 4px 20px rgba(0, 0, 0, 0.1)`,d=`${o}60`;e.addEventListener("mouseenter",()=>{requestAnimationFrame(()=>{s(e,{brightness:1.2,boxShadow:i,borderColor:d});const a=document.querySelector(`[data-target-step="${r}"]`);a instanceof HTMLElement&&s(a,{brightness:1.2})})}),e.addEventListener("mouseleave",()=>{requestAnimationFrame(()=>{n(e);const a=document.querySelector(`[data-target-step="${r}"]`);a instanceof HTMLElement&&n(a)})})}),u.forEach(e=>{if(!(e instanceof HTMLElement))return;const t=e.getAttribute("data-target-step"),r=document.querySelector(`[data-step-index="${t}"]`);if(t&&r instanceof HTMLElement){const o=c[parseInt(t)],i=`${o}60`,d=`0 0 40px ${o}30, 0 0 20px ${o}20, 0 4px 20px rgba(0, 0, 0, 0.1)`;e.addEventListener("mouseenter",()=>{requestAnimationFrame(()=>{s(r,{brightness:1.2,borderColor:i,boxShadow:d})})}),e.addEventListener("mouseleave",()=>{requestAnimationFrame(()=>{n(r)})}),e.addEventListener("touchstart",()=>{requestAnimationFrame(()=>{s(r,{brightness:1.2,borderColor:i,boxShadow:d})})},{passive:!0}),e.addEventListener("touchend",()=>{setTimeout(()=>{requestAnimationFrame(()=>{n(r)})},300)},{passive:!0}),r.addEventListener("mouseenter",()=>{requestAnimationFrame(()=>{s(e,{brightness:1.2})})}),r.addEventListener("mouseleave",()=>{requestAnimationFrame(()=>{n(e)})}),r.addEventListener("touchstart",()=>{requestAnimationFrame(()=>{s(e,{brightness:1.2})})},{passive:!0}),r.addEventListener("touchend",()=>{setTimeout(()=>{requestAnimationFrame(()=>{n(e)})},300)},{passive:!0})}})});']], "assets": ["/_astro/index.B_RJBm-w.css", "/_astro/index.Clx7WlIp.css", "/favicon.svg", "/pixel-canvas.js", "/_worker.js/_@astrojs-ssr-adapter.mjs", "/_worker.js/_astro-internal_middleware.mjs", "/_worker.js/_noop-actions.mjs", "/_worker.js/index.js", "/_worker.js/renderers.mjs", "/_astro/ChatBox.astro_astro_type_script_index_0_lang.qAfX_Kxj.js", "/_astro/settingsmodal.astro_astro_type_script_index_0_lang.C_2CPT3b.js", "/_worker.js/_astro/index.B_RJBm-w.css", "/_worker.js/_astro/index.Clx7WlIp.css", "/_worker.js/chunks/ChatBox_BTFFVlFh.mjs", "/_worker.js/chunks/_@astrojs-ssr-adapter_BMnV9V6n.mjs", "/_worker.js/chunks/astro-designed-error-pages_zET6Ym84.mjs", "/_worker.js/chunks/astro_D6ldDBhZ.mjs", "/_worker.js/chunks/cloudflare-kv-binding_DMly_2Gl.mjs", "/_worker.js/chunks/index_BOXgeMNR.mjs", "/_worker.js/chunks/kvEncryption_B8t-dpS8.mjs", "/_worker.js/chunks/noop-middleware_YAKwe5pu.mjs", "/_worker.js/pages/404.astro.mjs", "/_worker.js/pages/_image.astro.mjs", "/_worker.js/pages/index.astro.mjs", "/_worker.js/chunks/astro/server_BRKsKzpO.mjs", "/_worker.js/pages/api/calendar-health.astro.mjs", "/_worker.js/pages/api/chat.astro.mjs", "/_worker.js/pages/api/kv-analysis.astro.mjs", "/_worker.js/pages/api/security-status.astro.mjs", "/_worker.js/pages/api/verify-meeting-action.astro.mjs"], "buildFormat": "directory", "checkOrigin": true, "serverIslandNameMap": [], "key": "nt+kumw9hrTqNfMTNd7zaYUAu0uH0AVbh3r1AR2eP9c=", "sessionConfig": { "driver": "cloudflare-kv-binding", "options": { "binding": "SESSION" } } });
if (manifest.sessionConfig) manifest.sessionConfig.driverModule = () => Promise.resolve().then(() => (init_cloudflare_kv_binding_DMly_2Gl(), cloudflare_kv_binding_DMly_2Gl_exports));

// dist/_worker.js/index.js
globalThis.process ??= {};
globalThis.process.env ??= {};
var serverIslandMap = /* @__PURE__ */ new Map();
var _page0 = /* @__PURE__ */ __name(() => Promise.resolve().then(() => (init_image_astro(), image_astro_exports)), "_page0");
var _page1 = /* @__PURE__ */ __name(() => Promise.resolve().then(() => (init_astro(), astro_exports)), "_page1");
var _page22 = /* @__PURE__ */ __name(() => Promise.resolve().then(() => (init_calendar_health_astro(), calendar_health_astro_exports)), "_page2");
var _page32 = /* @__PURE__ */ __name(() => Promise.resolve().then(() => (init_chat_astro(), chat_astro_exports)), "_page3");
var _page42 = /* @__PURE__ */ __name(() => Promise.resolve().then(() => (init_kv_analysis_astro(), kv_analysis_astro_exports)), "_page4");
var _page52 = /* @__PURE__ */ __name(() => Promise.resolve().then(() => (init_security_status_astro(), security_status_astro_exports)), "_page5");
var _page62 = /* @__PURE__ */ __name(() => Promise.resolve().then(() => (init_verify_meeting_action_astro(), verify_meeting_action_astro_exports)), "_page6");
var _page72 = /* @__PURE__ */ __name(() => Promise.resolve().then(() => (init_index_astro(), index_astro_exports)), "_page7");
var pageMap = /* @__PURE__ */ new Map([
  ["node_modules/@astrojs/cloudflare/dist/entrypoints/image-endpoint.js", _page0],
  ["src/pages/404.astro", _page1],
  ["src/pages/api/calendar-health.ts", _page22],
  ["src/pages/api/chat.ts", _page32],
  ["src/pages/api/kv-analysis.ts", _page42],
  ["src/pages/api/security-status.ts", _page52],
  ["src/pages/api/verify-meeting-action.ts", _page62],
  ["src/pages/index.astro", _page72]
]);
var _manifest = Object.assign(manifest, {
  pageMap,
  serverIslandMap,
  renderers,
  actions: /* @__PURE__ */ __name(() => Promise.resolve().then(() => (init_noop_actions(), noop_actions_exports)), "actions"),
  middleware: /* @__PURE__ */ __name(() => Promise.resolve().then(() => (init_astro_internal_middleware(), astro_internal_middleware_exports)), "middleware")
});
var _args = void 0;
var _exports = createExports(_manifest);
var __astrojsSsrVirtualEntry = _exports.default;
var _start = "start";
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) {
  serverEntrypointModule[_start](_manifest, _args);
}

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var drainBody = /* @__PURE__ */ __name(async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } catch (e) {
    const error4 = reduceError(e);
    return Response.json(error4, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-mlX9RA/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = __astrojsSsrVirtualEntry;

// node_modules/wrangler/templates/middleware/common.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env2, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env2, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env2, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env2, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-mlX9RA/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env2, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env2, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env2, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init2) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init2.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env2, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env2, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env2, ctx) => {
      this.env = env2;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init2) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init2.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default,
  pageMap
};
/**
 * shortdash - https://github.com/bibig/node-shorthash
 *
 * @license
 *
 * (The MIT License)
 *
 * Copyright (c) 2013 Bibig <bibig@me.com>
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */
/*! https://mths.be/cssesc v3.0.0 by @mathias */
//# sourceMappingURL=index.js.map
