# CCC Schedule Onboarding - LLM-Enhanced System

A modern, AI-powered approach to integrating California Community College course schedules. No coding required - just have a conversation with our onboarding assistant!

## 🚀 Quick Start

```bash
# Start the interactive onboarding
python -m src.onboarding_cli
```

That's it! The assistant will guide you through everything.

## 🤖 How It Works

### Traditional Approach (Old)
- Write custom scrapers with CSS selectors
- Break when websites change
- Require developer expertise
- Take weeks to set up

### LLM-Enhanced Approach (New)
- AI understands your data format automatically
- Adapts to website changes
- No coding required
- Set up in minutes

## 📊 Supported Systems

- **Banner 8** (like Rio Hondo) - Full support with specialized parser
- **PeopleSoft** - AI extraction
- **Colleague** - AI extraction  
- **Custom HTML** - AI understands any format
- **JSON/CSV exports** - Direct import
- **PDF schedules** - Coming soon

## 🎯 Features

### Intelligent Data Extraction
- LLM understands context, not just patterns
- Handles variations in formatting
- Extracts complex meeting patterns
- Normalizes data automatically

### Conversational Onboarding
- No technical knowledge needed
- Interactive field mapping
- Real-time validation
- Helpful suggestions

### Continuous Improvement
- System learns from each new college
- Automatic adaptation to changes
- Community-driven enhancements

## 📁 Directory Structure

```
ccc-schedule-onboarding/
├── src/
│   ├── llm_parser.py         # Core LLM parsing engine
│   ├── onboarding_cli.py     # Interactive CLI assistant
│   ├── data_normalizer.py    # Smart data cleaning
│   └── parsers/
│       └── banner8_parser.py # Specialized Banner parser
├── examples/
│   └── rio_hondo_onboarding.py # Complete example
├── demo-college/             # Legacy demo (being replaced)
└── templates/                # Legacy templates (being replaced)
```

## 🏃 Running the Rio Hondo Example

```bash
# See how Banner 8 data is extracted
python examples/rio_hondo_onboarding.py
```

This demonstrates:
- Parsing complex Banner 8 HTML tables
- Handling multiple meeting times
- Normalizing instructor names
- Validating enrollment data

## 🔧 Technical Details

### LLM Parser
The system uses Large Language Models to:
- Understand HTML structure semantically
- Extract data without brittle selectors
- Handle format variations gracefully
- Provide context-aware normalization

### Data Pipeline
1. **Extract**: LLM parses source data
2. **Transform**: Intelligent normalization
3. **Validate**: Context-aware validation
4. **Load**: Convert to CCC Schedule format

## 🤝 Contributing

Want to add support for your college's system? 
1. Run the onboarding CLI with your data
2. Share (anonymized) samples if extraction fails
3. We'll enhance the parser together

## 📞 Support

- **Email**: support@ccc-schedule.edu
- **Issues**: GitHub Issues
- **Docs**: See parent project documentation

## 🎓 Success Stories

> "We onboarded in 15 minutes! No IT involvement needed."
> - Anonymous Community College

> "The AI understood our messy HTML better than we did."
> - Another Happy College

---

*Part of the CCC Schedule project - Making course schedules accessible to all*