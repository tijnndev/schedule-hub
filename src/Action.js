class Action {
  constructor(name, fn) {
    this.name = name;
    this.fn = fn;
    this.source = fn ? Action.dedent(fn.toString()) : null;
  }

  async execute(input) {
    return await this.fn(input);
  }

  static dedent(str) {
    const lines = str.split('\n');
    if (lines.length <= 1) return str;
    const indents = lines.slice(1)
      .filter(l => l.trim().length > 0)
      .map(l => l.match(/^(\s*)/)[1].length);
    if (indents.length === 0) return str;
    const min = Math.min(...indents);
    if (min === 0) return str;
    return lines.map((l, i) => i === 0 ? l : l.slice(min)).join('\n');
  }
}

module.exports = Action;
