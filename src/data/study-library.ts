import cloud from './curriculum/cloud.json'
import german from './curriculum/german.json'
import russian from './curriculum/russian.json'
import llms from './curriculum/llms.json'
import rag from './curriculum/rag.json'
import agents from './curriculum/agents.json'
import rpa from './curriculum/rpa.json'
import { buildStudyMap } from './build-study-map'
import type { StudyModule } from './build-study-map'

export const studyModules = [cloud, german, russian, llms, rag, agents, rpa] as StudyModule[]
export const studyMaps = studyModules.map(buildStudyMap)
