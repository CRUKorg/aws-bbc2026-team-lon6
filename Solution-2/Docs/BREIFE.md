
# AWS Breaking Barriers Hackathon Brief – Cancer Research UK

Cancer Research UK exists to beat cancer. For the past 120 years, we’ve been making discoveries that save lives. But we have so much more to do as cancer remains one of the world's greatest health challenges. We want to bring about a world where everybody can lead longer, better lives, free from the fear of cancer.

## A world where:

- Some types of cancer are effectively eliminated
- Many more are prevented from developing in the first place
- People who do develop cancer are diagnosed at the earliest possible stage so they can be successfully treated
- Treatments are more effective, kinder and more targeted, so people can lead better, more fulfilling lives
- Everyone shares in this progress equally, regardless of who they are, where they’re from or what type of cancer they have

People facing cancer need the right information at the right time, but everyone's journey is different. How can AI:

- Deliver relevant, personalised cancer information based on diagnosis, treatment stage or personal circumstances whilst ensuring appropriate consent is in place to process actual or inferred special category personal data
- Make complex medical information accessible across different health literacy levels
- Provide multilingual support or alternative formats for diverse audiences
- Surface the most relevant resources from CRUK's vast information library

### 2. Supporter Journey Acceleration

Every supporter has unique motivations and capacity to engage. How can AI:

- Inspire supporters to take meaningful action and identify the best next action for each supporter (donate, volunteer, fundraise, campaign)
- Personalise communication without waiting for complete data integration
- Predict supporter preferences and lifetime value to prioritise engagement
- Create tailored volunteer or fundraising opportunities based on skills, location, and interests

### 3. Transformation Acceleration Tools

The transformation programme itself could benefit from AI. How can AI:

- Generate insights from existing fragmented data sources to inform transformation priorities
- Create synthetic or anonymised datasets to test personalisation strategies safely
- Automate data quality improvement or entity resolution across legacy systems
- Prototype the "end state" experience to validate transformation assumptions
- Demonstrate how personalisation can transform fragmented experiences into connected journeys

### 4. Conversational Support

Personal, empathetic interaction matters when someone is navigating cancer. How can AI:

- Guide people in their worst time of distress to valuable information or support they need
- Help information seekers quickly find relevant cancer information in a clear, empathetic way
- Provide 24/7 conversational support for cancer information queries
- Triage questions to appropriate human experts or resources
- Offer emotional support while signposting to counseling services
- Answer supporter questions about how to help CRUK's mission

---

## Deliverables

- A working prototype
---

## What Success Looks Like



---

Further context: Big AI companies are building a really clear understanding of users through every day interactions with generative AI applications (like chat gpt). Charities have a vested interest in responsibily understanding our users and supporting them in order to inspire them to deepen their support for us (maximise supporter value)
## Propsal - What we want to build - what we refined

An MVP experience that rethinks our digital front door (our main site: https://www.cancerresearchuk.org/)

The LLM is responsible for initially triggering the personalisation journey. If it detects the user's intent is to seek information it triggers that flow. It asks if it can resume the personalisation flow. If the user inputs their intent is to stop the personalisation flow (), the LLM should also understand this.

PERSONALISATION: User Journey MVP
1) Journey begins with user access site. User logs in. 
The personalisation engine will access that user's database/attributes including any previous contextual information (e.g. have they run for CRUK, attended our events, are they a researcher/journalist/philanthropist/affected by cancer personally or a loved one).
If the personalisation engine has prior context it presents both Dashboard-like information including:

* "Total amount raised for CRUK"
* "Current fundraising campaign amount vs target"

1b -personalisation flow If the personalisation engine has no prior context it asks the user "Are you new to Cancer Research UK? What do you know about CRUK? Have you supported us in any way before?" This then goes through the user new personalisation flow (see flow below)

2) The next step is the personalisation engine produces relevant information about the charity and its achievements to motivate and inspire the user

3) The final personalisation experience is a call to action. "A straightforward way to support us is to become a regular giver"


INFORMATION SEEKING EXPERIENCE:
The user might say that they want to find information About Cancer. They can use the interface to retrieve basic links and articles. The app doesn't need to create a summary. The LLM should validate with the user whether they have everything they need, gather user sentiment in a few words of feedback and ask to resume the personalisation journey (either the 1b flow or )



Background Data Context - 

User Identity: - 
User Profile: -
User New input:
* User passes new personalisation (initial input)
* system summarises and confirms accuracy with user ()
* system saves it in structured or semi-structured format that records when the user updated that information (date/time stamp)
* system can now use that as trusted information and does not retrieve the initial user input
Information Seeking Experience input:
* User's passes information seeking request
* User's intent is recorded
User sentiment request:

Existing structured information (knowledge and tools):
* an MCP server/API that can call a database associated with a given user and return values for given fields
* an MCP server/API that can call a database in real-time to find out about most recent transactions (to validate a user has just donated)
* list of pages the user has visited
* an MCP server/API that call call a database of some research papers we have recently published
* TBC ---- others available in github repository



---

NFR
We think that in order to do this, we will want MCP servers and an agentic architecture.
We believe that a low-cost, low latency solution will be the best value for our supporters
The solution needs to be secure and compliant with relevant regulatiosn including GDPR and financial compliance frameworks.
---

We plan to integrate this with a front end - this does not need to be built in detail but can be used to demonstrate how the solution might work

Font end requirements: 
 
Personalisation container on landing page: 
Name 
Total donations bar 
Recommended 'click to donate' buttons with amounts based on previous behaviour 
Impact breakdown showing what specifically their previous donations have funded I.e. test tubes  
Recommended CRUK pages based on activity
Pull high impact/prestigiously published research papers from our database (e.g. paper published in Nature funded by CRUK)
 
If data missing, container with: 
Appropriate question for missing data 
Free text search bar with prompt 'what are you looking for today' 
 
For scope 1 data is (subject to change): 
Age 
Gender 
Always free text search bar with prompt 'what are you looking for today' 
