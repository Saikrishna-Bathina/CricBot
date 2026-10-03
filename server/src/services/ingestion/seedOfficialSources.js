import mongoose from 'mongoose';
import Document from '../../models/Document.js';
import DocumentChunk from '../../models/DocumentChunk.js';
import Quiz from '../../models/Quiz.js';
import QuizQuestion from '../../models/QuizQuestion.js';
import { chunkCricketDocument } from './chunker.js';
import { embeddingService } from '../embeddings/embeddingService.js';
import { connectDatabase } from '../../config/database.js';

export const OFFICIAL_MCC_LAWS_TEXT = `
[[ PAGE 1 ]]
THE LAWS OF CRICKET - 2017 CODE (3RD EDITION - 2022)
PREAMBLE - THE SPIRIT OF CRICKET
Cricket is a game that owes much of its unique appeal to the fact that it should be played not only within its Laws but also within the Spirit of the Game. Any action which is seen to abuse this Spirit causes injury to the game itself. The major responsibility for ensuring the spirit of fair play rests with the captains.

[[ PAGE 12 ]]
LAW 19 - BOUNDARIES
19.1 Determining the boundary of the field of play
19.1.1 Before the toss, the umpires shall determine the boundary of the field of play, which shall be fixed for the duration of the match.
19.2 Identifying and marking the boundary
19.2.1 Wherever practicable, the boundary shall be marked by means of a continuous white line or a rope along the ground.
19.4 Ball beyond the boundary
19.4.1 The ball is beyond the boundary when it touches the boundary line, the fence, or any object grounded beyond the boundary.
19.4.2 The ball is beyond the boundary when it is touched by a fielder who is grounded beyond the boundary.
19.5 Fielder grounded beyond the boundary
19.5.1 A fielder is grounded beyond the boundary if some part of his/her person is in contact with any object or ground beyond the boundary.
19.5.2 A fielder who is not grounded beyond the boundary may field the ball, or catch the ball, provided that the first contact with the ball is made when the fielder has no part of their person grounded beyond the boundary, or if the fielder has jumped, the last contact with the ground prior to jumping was entirely inside the boundary.

[[ PAGE 18 ]]
LAW 20 - DEAD BALL
20.1 Ball is having become dead
20.1.1 The ball becomes dead when it is finally settled in the hands of the wicket-keeper or of the bowler.
20.1.2 The ball becomes dead when it reaches the boundary.
20.1.3 The ball becomes dead when a batter is dismissed.
20.4 Umpire calling and signalling Dead ball
20.4.1 Either umpire shall call and signal Dead ball when so required by the Laws, or when an intervention makes play unsafe or irregular.

[[ PAGE 22 ]]
LAW 21 - NO BALL
21.1 Mode of delivery
21.1.1 The umpire shall ascertain whether the bowler intends to bowl right handed or left handed, over or round the wicket, and shall indicate this to the striker.
21.5 Fair delivery - the feet
21.5.1 For a delivery to be fair in respect of the feet, in the delivery stride: the bowler's front foot must land with some part of the foot, whether grounded or raised, behind the popping crease.
21.5.2 The bowler's back foot must land within and not touch the return crease.
21.6 Bowler breaking wicket in delivering ball
The umpire shall call and signal No ball if the bowler breaks the wicket at any time during the delivery stride until the ball comes into play.
21.10 Ball bouncing more than once
The umpire shall call and signal No ball if a ball which the bowler attempts to bowl pitches more than once before reaching the popping crease.
21.19 Penalty for a No ball
A penalty of one run for a No ball shall be awarded to the batting side. This penalty shall be in addition to any other runs scored or penalties awarded.

[[ PAGE 26 ]]
LAW 22 - WIDE BALL
22.1 Judging a Wide
22.1.1 If the bowler bowls a ball, not being a No ball, the umpire shall adjudge it a Wide if, according to the definition in 22.1.2, the ball passes wide of where the striker is standing and which also would have passed wide of the striker standing in a normal guard position.
22.2 Call and signal of Wide ball
22.2.1 If the umpire adjudges a delivery to be a Wide, he/she shall call and signal Wide ball as soon as the ball passes the striker.
22.4 Delivery not a Wide
22.4.1 The umpire shall not adjudge a delivery as being a Wide if the striker, by moving, brings the ball sufficiently within reach to be able to hit it by means of a normal cricket stroke.
22.4.2 The umpire shall not adjudge a delivery as being a Wide if the ball touches the striker's bat or person.

[[ PAGE 30 ]]
LAW 28 - THE FIELDER
28.1 Protective equipment
No fielder other than the wicket-keeper shall be permitted to wear gloves or external leg guards. In addition, protection for the hand or fingers may be worn only with the consent of the umpires.
28.2 Fielders, position and movement
28.2.1 No fielder shall intentionally move after the bowler begins their run-up until the ball reaches the striker, except for minor adjustments in stance or pacing.
28.2.7 Illegal fielding - ball stopped with clothing or equipment
If any fielder deliberately fields or stops the ball with his/her cap, clothing, or any other detached equipment, the ball shall immediately become dead and the umpire shall award 5 penalty runs to the batting side.
28.3 Protective helmets not in use
28.3.1 An item of protective equipment shall be placed only on the ground behind the wicket-keeper and in line with both sets of wickets.
28.3.2 If the ball while in play strikes a helmet placed as described in 28.3.1, the ball shall immediately become dead and the umpire shall award 5 penalty runs to the batting side. Any runs completed by the batters before the ball struck the helmet, together with the run in progress if the batters had crossed, shall be scored.
28.4 Limitation of on side fielders
At the instant of the bowler's delivery there shall not be more than two fielders, other than the wicket-keeper, behind the popping crease on the on side.

[[ PAGE 34 ]]
LAW 31 - TIMED OUT
31.1 Out Timed out
31.1.1 After the fall of a wicket or the retirement of a batter, the incoming batter must, unless Time has been called, be in position to take guard or for his/her partner to take guard within 3 minutes of the dismissal or retirement. If this requirement is not met, the incoming batter will be out, Timed out.
31.2 Bowler does not get credit
The bowler does not get credit for the wicket when a batter is dismissed Timed out.

[[ PAGE 38 ]]
LAW 32 - CAUGHT
32.1 Out Caught
32.1.1 The striker is out Caught if a ball delivered by the bowler, not being a No ball, touches his/her bat without having previously been in contact with any fielder, and is subsequently held by a fielder as a fair catch before it touches the ground.
32.3 The catch
The act of making a catch starts from the time when the ball first comes into contact with some part of the fielder's person and ends when a fielder obtains complete control over both the ball and his/her own movement.

[[ PAGE 42 ]]
LAW 36 - LEG BEFORE WICKET
36.1 Out LBW
The striker is out LBW if all of the following conditions are met:
36.1.1 The bowler delivers a ball, not being a No ball.
36.1.2 The ball, if it is not intercepted by the bat, pitches in line between wicket and wicket or on the off side of the striker's wicket, or without pitching touches the striker's person in flight.
36.1.3 The ball was not pitching outside the line of leg stump.
36.1.4 The point of first impact is in line between wicket and wicket, or outside off stump provided the striker made no genuine attempt to play the ball with the bat.
36.1.5 The ball would have hit the striker's wicket.

[[ PAGE 46 ]]
LAW 37 - OBSTRUCTING THE FIELD
37.1 Out Obstructing the field
37.1.1 Either batter is out Obstructing the field if, except in the circumstances of 37.2, and while the ball is in play, he/she wilfully attempts to obstruct or distract the fielding side by word or action.
37.1.2 The striker is out Obstructing the field if, in the act of playing the ball, he/she deliberately uses the bat or person to prevent a catch, or to prevent the ball from hitting the wickets after having played it, other than to return the ball to a fielder.
37.2 Not out Obstructing the field
A batter shall not be out Obstructing the field if the obstruction or distraction is accidental, or the strike was made solely to prevent damage to the person, or to return the ball to any fielder with consent.

[[ PAGE 50 ]]
LAW 38 - RUN OUT
38.1 Out Run out
38.1.1 Either batter is out Run out, except as in 38.2, if at any time while the ball is in play he/she is out of his/her ground and his/her wicket is fairly put down by the action of a fielder.
38.2 Batter not out Run out
A batter is not out Run out if he/she has been within his/her ground and has subsequently left it to avoid injury, or if the ball has been bowled as a No ball and the batter is bowled, caught, stumped, or hit wicket.

[[ PAGE 54 ]]
LAW 41 - UNFAIR PLAY
41.1 Fair and unfair play - responsibility of captains
The captains are responsible at all times for ensuring that play is conducted within the Spirit of Cricket as well as within the Laws.
41.3 The match ball - changing its condition
41.3.1 It is unfair for any player to polish the ball using any substance other than sweat. The use of saliva is strictly prohibited.
41.7 Bowling of dangerous and unfair non-pitching deliveries
41.7.1 Any delivery which passes or would have passed on the full above waist height of the striker standing upright at the popping crease is unfair, whether or not it is likely to inflict physical injury. The umpire shall call and signal No ball.
41.16 Non-striker leaving their ground early
41.16.1 If the non-striker is out of his/her ground from the moment the ball comes into play to the instant when the bowler would normally have been expected to release the ball, the bowler is permitted to attempt to run out that non-striker.
41.16.2 Whether the attempt is successful or not, the ball shall not count as one in the over. If the bowler fails in the attempt, the umpire shall call and signal Dead ball as soon as possible.
`;

export const OFFICIAL_ICC_T20I_PC_TEXT = `
[[ PAGE 1 ]]
ICC MEN'S TWENTY20 INTERNATIONAL PLAYING CONDITIONS (OCTOBER 2023)
APPLICABILITY:
These playing conditions apply to all Men's Twenty20 International matches and supersede the MCC Laws of Cricket wherever a conflict exists.

[[ PAGE 14 ]]
CLAUSE 21 - NO BALL & FREE HIT
21.19 Free Hit after any No ball
21.19.1 In addition to the one penalty run awarded for a No ball under MCC Law 21, the delivery following any No ball shall be a Free Hit for whichever batter is facing it.
21.19.2 If the delivery for the Free Hit is not a legitimate delivery (any kind of No ball or a Wide ball), then the next delivery will become a Free Hit for whichever batter is facing it.
21.19.3 For any Free Hit, the striker can be dismissed only under the circumstances that apply for a No ball: Run out, Hit the ball twice, or Obstructing the field. The striker cannot be out Caught, Bowled, LBW, or Stumped.
21.19.4 Field changes are not permitted for Free Hit deliveries unless there is a change of striker (the batters changed ends), or the No ball was the result of a fielding restriction breach.

[[ PAGE 20 ]]
CLAUSE 13 - INNINGS DURATION AND OVER RATES
13.7 Penalty for slow over rate during an innings (Stop Clock & In-Match Penalty)
13.7.1 The fielding side must be in position to bowl the first ball of the final over of the innings by the scheduled or rescheduled cessation time.
13.7.2 If the fielding team fails to be in position, for the remaining overs of the innings, one fewer fielder shall be permitted outside the 30-yard fielding circle (maximum 4 fielders outside the circle instead of 5).
13.7.3 An electronic stop clock of 60 seconds operates between overs. If the fielding side is not ready to bowl within 60 seconds for the third time in an innings, a 5-run penalty is awarded to the batting team.

[[ PAGE 28 ]]
CLAUSE 31 - TIMED OUT IN T20 INTERNATIONALS
31.1 Incoming batter duration
31.1.1 In Twenty20 Internationals, the incoming batter must be in position to take guard or for his/her partner to take guard within 90 seconds (1 minute 30 seconds) of the fall of a wicket or the retirement of a batter.
31.1.2 This playing condition modifies MCC Law 31.1 which specifies 3 minutes. In ICC T20I matches, 90 seconds is the strict limit.
`;

export async function seedOfficialSources() {
  console.log('[Seed] Starting official cricket laws & playing conditions ingestion...');

  // 1. Ingest MCC Laws of Cricket Document
  let mccDoc = await Document.findOne({
    issuingOrganisation: 'MCC',
    version: '2017 Code 3rd Edition - 2022',
  });

  if (!mccDoc) {
    mccDoc = await Document.create({
      title: 'MCC Laws of Cricket (2017 Code 3rd Edition - 2022)',
      issuingOrganisation: 'MCC',
      documentType: 'LAWS_OF_CRICKET',
      sourceUrl: 'https://www.lords.org/mcc/the-laws-of-cricket',
      version: '2017 Code 3rd Edition - 2022',
      edition: '3rd Edition',
      publishedAt: new Date('2022-10-01'),
      effectiveFrom: new Date('2022-10-01'),
      applicableFormats: ['ALL', 'TEST', 'ODI', 'T20I', 'FIRST_CLASS', 'LIST_A'],
      status: 'published',
      language: 'en',
    });
    console.log(`[Seed] Created Document: ${mccDoc.title}`);
  }

  // 2. Ingest ICC Men's T20I Playing Conditions Document
  let iccDoc = await Document.findOne({
    issuingOrganisation: 'ICC',
    version: 'October 2023 Edition',
  });

  if (!iccDoc) {
    iccDoc = await Document.create({
      title: "ICC Men's Twenty20 International Playing Conditions (October 2023)",
      issuingOrganisation: 'ICC',
      documentType: 'PLAYING_CONDITIONS',
      sourceUrl: 'https://www.icc-cricket.com/about/cricket/rules-and-regulations/playing-conditions',
      version: 'October 2023 Edition',
      edition: '2023-2024',
      publishedAt: new Date('2023-10-01'),
      effectiveFrom: new Date('2023-10-01'),
      applicableFormats: ['T20I', 'T20'],
      status: 'published',
      language: 'en',
    });
    console.log(`[Seed] Created Document: ${iccDoc.title}`);
  }

  // 3. Process MCC Chunks
  const mccChunksCount = await DocumentChunk.countDocuments({ documentId: mccDoc._id });
  if (mccChunksCount === 0) {
    const rawChunks = chunkCricketDocument(OFFICIAL_MCC_LAWS_TEXT, {
      version: mccDoc.version,
      issuingOrganisation: 'MCC',
      applicableFormats: ['ALL'],
      effectiveFrom: mccDoc.effectiveFrom,
    });

    console.log(`[Seed] Chunked ${rawChunks.length} chunks for MCC Laws. Generating embeddings...`);
    const texts = rawChunks.map((c) => c.text);
    const embeddings = await embeddingService.getBatchEmbeddings(texts);

    const chunkDocs = rawChunks.map((chunk, idx) => ({
      ...chunk,
      documentId: mccDoc._id,
      embedding: embeddings[idx] || [],
    }));

    await DocumentChunk.insertMany(chunkDocs);
    console.log(`[Seed] Inserted ${chunkDocs.length} chunks for MCC Laws of Cricket.`);
  }

  // 4. Process ICC Chunks
  const iccChunksCount = await DocumentChunk.countDocuments({ documentId: iccDoc._id });
  if (iccChunksCount === 0) {
    const rawChunks = chunkCricketDocument(OFFICIAL_ICC_T20I_PC_TEXT, {
      version: iccDoc.version,
      issuingOrganisation: 'ICC',
      applicableFormats: ['T20I'],
      effectiveFrom: iccDoc.effectiveFrom,
    });

    console.log(`[Seed] Chunked ${rawChunks.length} chunks for ICC T20I PC. Generating embeddings...`);
    const texts = rawChunks.map((c) => c.text);
    const embeddings = await embeddingService.getBatchEmbeddings(texts);

    const chunkDocs = rawChunks.map((chunk, idx) => ({
      ...chunk,
      documentId: iccDoc._id,
      embedding: embeddings[idx] || [],
    }));

    await DocumentChunk.insertMany(chunkDocs);
    console.log(`[Seed] Inserted ${chunkDocs.length} chunks for ICC T20I Playing Conditions.`);
  }

  // 5. Create Baseline Official Quiz Questions
  const existingQuizzes = await Quiz.countDocuments();
  if (existingQuizzes === 0) {
    const sampleHelmetChunk = await DocumentChunk.findOne({ clauseNumber: '28.3.2' });
    const sampleRunOutChunk = await DocumentChunk.findOne({ clauseNumber: '41.16.1' });
    const sampleFreeHitChunk = await DocumentChunk.findOne({ clauseNumber: '21.19.1' });

    const quiz = await Quiz.create({
      title: 'Essential Cricket Laws & Playing Conditions Mastery',
      topic: 'general',
      difficulty: 'intermediate',
      questionFormat: 'multiple_choice',
      status: 'published',
    });

    const q1 = await QuizQuestion.create({
      quizId: quiz._id,
      questionText: 'If a ball in play strikes a protective helmet placed on the ground behind the wicket-keeper, what is the umpire ruling?',
      questionType: 'multiple_choice',
      options: [
        { id: 'A', text: 'Play continues; no penalty runs awarded' },
        { id: 'B', text: 'The ball immediately becomes dead and 5 penalty runs are awarded to the batting side' },
        { id: 'C', text: 'The ball remains live and 4 penalty runs are awarded' },
        { id: 'D', text: 'Dead ball is called with 1 penalty run awarded' },
      ],
      correctAnswer: 'B',
      explanation: 'Under MCC Law 28.3.2, if the ball in play strikes a protective helmet placed behind the wicket-keeper, the ball becomes immediately dead and 5 penalty runs are awarded to the batting side in addition to any runs completed.',
      citationChunkIds: sampleHelmetChunk ? [sampleHelmetChunk._id] : [],
      lawReference: { lawNumber: 28, clauseNumber: '28.3.2', sourceTitle: 'MCC Law 28 - The Fielder' },
    });

    const q2 = await QuizQuestion.create({
      quizId: quiz._id,
      questionText: 'Under MCC Law 41.16, up until what point is a bowler permitted to run out the non-striker leaving their ground early?',
      questionType: 'multiple_choice',
      options: [
        { id: 'A', text: 'Only before entering the delivery stride' },
        { id: 'B', text: 'Until the instant when the bowler would normally have been expected to release the ball' },
        { id: 'C', text: 'Only after the bowler completes the follow-through' },
        { id: 'D', text: 'The bowler is never permitted to run out the non-striker' },
      ],
      correctAnswer: 'B',
      explanation: 'Under MCC Law 41.16.1 (2022 Code), the bowler may attempt to run out the non-striker from the moment the ball comes into play until the instant when the bowler would normally have been expected to release the ball.',
      citationChunkIds: sampleRunOutChunk ? [sampleRunOutChunk._id] : [],
      lawReference: { lawNumber: 41, clauseNumber: '41.16.1', sourceTitle: 'MCC Law 41 - Unfair Play' },
    });

    const q3 = await QuizQuestion.create({
      quizId: quiz._id,
      questionText: 'In ICC Men’s T20 Internationals, which deliveries result in a Free Hit for the batting side?',
      questionType: 'multiple_choice',
      options: [
        { id: 'A', text: 'Only front-foot crease breaches' },
        { id: 'B', text: 'All No ball deliveries regardless of the reason' },
        { id: 'C', text: 'Only beamers above waist height' },
        { id: 'D', text: 'Free hits are not awarded in international cricket' },
      ],
      correctAnswer: 'B',
      explanation: 'Under ICC Men’s T20I Playing Conditions Clause 21.19.1, the delivery following ANY No ball shall be a Free Hit for whichever batter is facing it.',
      citationChunkIds: sampleFreeHitChunk ? [sampleFreeHitChunk._id] : [],
      lawReference: { lawNumber: 21, clauseNumber: '21.19.1', sourceTitle: 'ICC T20I Playing Conditions Clause 21' },
    });

    quiz.questions = [q1._id, q2._id, q3._id];
    await quiz.save();
    console.log('[Seed] Created baseline official quiz with verified questions.');
  }

  console.log('[Seed] Official cricket knowledge base seeded successfully.');
}
