import { Failure, AbstractFormatter, FileSummary, Severity } from '@fimbul/ymir';
import chalk from 'chalk';
import * as path from 'path';

interface FailureInfo {
    severity: Severity;
    ruleName: string;
    position: string;
    message: string;
}

export class Formatter extends AbstractFormatter {
    private fixed = 0;
    private fixable = 0;

    private maxSeverityWidth = 0;
    private maxPositionWidth = 0;
    private maxNameWidth = 0;

    private files = new Map<string, FailureInfo[]>();

    public format(fileName: string, summary: FileSummary): undefined {
        this.fixed += summary.fixes;
        if (summary.failures.length === 0)
            return;
        const mapped: FailureInfo[] = [];
        for (const failure of summary.failures.slice().sort(Failure.compare)) {
            if (failure.fix !== undefined)
                ++this.fixable;
            if (failure.severity.length > this.maxSeverityWidth)
                this.maxSeverityWidth = failure.severity.length;
            if (failure.ruleName.length > this.maxNameWidth)
                this.maxNameWidth = failure.ruleName.length;
            let {character, line} = failure.start;
            if (line !== 0 || character === 0 || !summary.content.startsWith('\uFEFF'))
                character += 1; // avoid incrementing the character position on the first line if BOM is present, editors ignore BOM
            const position = `${line + 1}:${character}`;
            if (position.length > this.maxPositionWidth)
                this.maxPositionWidth = position.length;
            mapped.push({
                position,
                severity: failure.severity,
                ruleName: failure.ruleName,
                message: failure.message,
            });
        }
        this.files.set(fileName, mapped);
        return;
    }

    public flush() {
        let errors = 0;
        let warnings = 0;
        const lines: string[] = [];

        for (const [fileName, failures] of this.files) {
            lines.push(
                '',
                `${chalk.underline(path.normalize(fileName))}${chalk.hidden(':' + failures[0].position)}`,
            );
            for (const failure of failures) {
                let positionColor: typeof chalk;
                if (failure.severity === 'error') {
                    positionColor = chalk.red;
                    ++errors;
                } else {
                    positionColor = chalk.yellow;
                    ++warnings;
                }
                lines.push(
                    positionColor(
                        pad(failure.severity.toUpperCase(), this.maxSeverityWidth) + ' ' + pad(failure.position, this.maxPositionWidth),
                    ) + `  ${chalk.grey(pad(failure.ruleName, this.maxNameWidth))}  ${chalk.blueBright(failure.message)}`,
                );
            }
        }
        if (this.fixed !== 0)
            lines.push(
                '', chalk.green(`Automatically fixed ${addCount(this.fixed, 'failure')}.`),
            );
        if (this.files.size !== 0) {
            const summaryLine = [];
            if (errors !== 0)
                summaryLine.push(chalk.red.bold(`✖ ${addCount(errors, 'error')}`));
            if (warnings !== 0)
                summaryLine.push(chalk.yellow.bold(`⚠ ${addCount(warnings, 'warning')}`));
            lines.push('', summaryLine.join('  '));
            if (this.fixable !== 0)
                lines.push(
                    chalk.grey(
                        addCount(this.fixable, 'failure') + ' ' +
                        (this.fixable === 1 ? 'is' : 'are') + " potentially fixable with the '--fix' option.",
                    ),
                );
        }
        return lines.length === 0
            ? undefined
            : lines.slice(1).join('\n'); // remove first line, because it's always empty
    }
}

function addCount(count: number, word: string) {
    return `${count} ${word}${count === 1 ? '' : 's'}`;
}

function pad(str: string, width: number) {
    return str + ' '.repeat(width - str.length);
}
