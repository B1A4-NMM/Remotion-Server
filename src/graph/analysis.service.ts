import { Neo4jService } from './neo4j.service';
import { ClaudeService } from '../claude/claude.service';
import { Injectable } from '@nestjs/common';
import { Person, ProblemAnalysis, Reflection } from '../util/json.parser';
import { RelationType } from '../enums/relation-type.enum';

@Injectable()
export class AnalysisService {
  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly promptService: ClaudeService,
  ) {}

  async analysisAll(prompt: string, memberId = "demo") {

    const content = prompt
    const result = await this.promptService.queryDiaryPatterns(prompt);
    const reflection = result.reflection
    const activities = result.activity_analysis

    activities.forEach(activity => {
      const activityTitle = activity.activity
      const problem = activity.problem
      const peoples = activity.peoples

      this.analysisProblem(problem)
      this.analysisPeople(peoples)


    })

    await this.analysisReflection(reflection);

    return result;
  }

  private async analysisProblem(problem: ProblemAnalysis) {
    const problemTitle = problem.problem
    const cause = problem.cause
    const approach = problem.approach
    const outcome = problem.outcome
    const strength = problem.strength
    const weakness = problem.weakness
  }

  private async analysisPeople(people: Person[]) {
    people.forEach(person => {
      const name = person.name
      const relationType = person.relationship_type
      const emotion = person.interactions
      const socialSimilarity = person.social_similarity
    })
  }

  private async analysisReflection(reflection: Reflection) {
    const achievement = reflection.achievements
    const shortcomings = reflection.shortcomings
    const tomorrowMindset = reflection.tomorrow_mindset
    const todos = reflection.todo
  }

}