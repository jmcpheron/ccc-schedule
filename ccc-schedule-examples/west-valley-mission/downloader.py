import json
import os
from urllib.request import Request, urlopen


def getTermData(term):

  # Trick Page Builder into thinking we are a browser
  headers = {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36', 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'}


  isExist = os.path.exists('data/' + term)
  if not isExist:
    # Create a new directory because it does not exist
    os.makedirs('data/' + term)

  # Term data
  term_domains = {
            'courses': 'scheduleCourses',
            'crns': 'scheduleCRNs',
            'ssrattr': 'scheduleSsrattr',
            'section-attributes': 'scheduleSectionAttributes',
            'ssrmeet': 'searchableSchedule',
            'sobptrm': 'scheduleSobptrm',
            'section-instructors': 'scheduleSectionInstructors',
            'instructors': 'scheduleInstructors',
            'subjcrse': 'scheduleSubjCrse',
            'subjects': 'scheduleSubj',
            'xlst':'scheduleXlst',
            'cohorts' : 'scheduleCohorts'}

  for fileName, virtualDomain in term_domains.items():
    url = "https://generalssb-prod.ec.wvm.edu/BannerExtensibility/internalPb/virtualDomains." + virtualDomain + "?term_code=" + term
    print(url)
    request = Request(url, headers=headers)
    html = urlopen(request).read()
    with open('data/' + term + '/' + fileName + '.json', 'wb') as f:
      f.write(html)

# Trick Page Builder into thinking we are a browser
headers = {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36', 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'}
url = "https://generalssb-prod.ec.wvm.edu/BannerExtensibility/internalPb/virtualDomains.scheduleSobterm"
print(url)
request = Request(url, headers=headers)
html = urlopen(request).read()
with open('data/sobterm.json', 'wb') as f:
    f.write(html)

#Loop through each term in scheduleSobterm and download all data
for x in json.loads(html):
  getTermData(x["SOBTERM_TERM_CODE"])


