import {myTest} from '../fixtures';
import { logToCommandConverter } from '../../utils/logToCommandConverter';
import { expect } from 'vitest';

myTest('should convert listening command', ({listeningLog}) => runSnapshotTest(listeningLog));
myTest('should convert watchtime command', ({watchtimeLog}) => runSnapshotTest(watchtimeLog));
myTest('should convert readtime command', ({readtimeLog}) => runSnapshotTest(readtimeLog));
myTest('should convert youtube command', ({youTubeLog}) => runSnapshotTest(youTubeLog));
myTest('should convert manga command', ({mangaLog}) => runSnapshotTest(mangaLog));
myTest('should convert anime command', ({animeLog}) => runSnapshotTest(animeLog));

const runSnapshotTest = (log) => {
    const command = logToCommandConverter(log);
    expect(command).toMatchSnapshot();
}