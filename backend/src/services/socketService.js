let _io = null;

module.exports = {
  init: (io) => { _io = io; },
  getIO: () => _io,
};
