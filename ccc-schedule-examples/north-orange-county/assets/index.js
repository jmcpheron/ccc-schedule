
        var subjectOnly = false;
        var scheduleJSON;
        var instructorsJSON;
        var termCode;
        var spinnerModal = new bootstrap.Modal(document.getElementById('spinner-modal'));
        var showMore = false;
        var courseSearchResults = new Array();
        var termChange = false;


        //loads the schedule into scheduleJSON
        function loadScheduleFromTerm(termCode, camp=1){

            //console.log(spinnerModal);
            spinnerModal.show();
            var wholeShebang = new Array();
            var comparisonsCount = 0;
            const date = new Date();
            const day = date.getDate().toString();
            const hour = date.getHours().toString();
            const minute = date.getMinutes().toString();
            const year = date.getFullYear().toString();
            const month = date.getMonth().toString();
            const paramStringDay = year+month+day;
            const paramStringHour = paramStringDay + hour;
            const paramStringMinute = paramStringHour + minute;
            //console.log(paramStringMinute);

            $.getJSON("data/courses.json?p=" + paramStringDay, function(){
            }).done(function(courses){
                wholeShebang = courses;
                $.getJSON("data/sections.json?p=" + paramStringMinute, function(){
                }).done(function(sections){
                    wholeShebang.forEach(course => {                                       
                        const sectionsArray = new Array();
                        sections.forEach(section => {
                            comparisonsCount ++;
                            if(section.sectSubjCode == course.crseSubjCode && section.sectCrseNumb== course.crseCrseNumb){
                                sectionsArray.push(section);
                            }   
                        });               
                        course.SECTIONS = sectionsArray;
                    });


                    scheduleJSON = wholeShebang;
                    //console.log("scheduleJson:");
                    //console.log(scheduleJSON);

                    const hideInaSec = setTimeout(function(){
                        spinnerModal.hide();
                    }, 500);
                });

            });
            
            /*
            $.getJSON("data/" + termCode + "/courses.json?p=" + paramStringDay, function(){
            }).done(function(courses){
                //console.log(courses);
                wholeShebang = courses;
                $.getJSON("data/" + termCode + "/crns.json?p=" + paramStringMinute, function(){

                }).done(function(sections){
                    //console.log(sections);
                    $.getJSON("data/" + termCode + "/ssrmeet.json?p=" + paramStringHour, function(){

                    }).done(function(meetings){
                        //console.log(meetings);
                        $.getJSON("data/" + termCode + "/section-instructors.json?p=" + paramStringHour, function(){

                        }).done(function(instructors){
                            //console.log("Section Instructors");
                            //console.log(instructors);

                            $.getJSON("data/" + termCode + "/section-attributes.json?p=" + paramStringHour, function(){


                            }).done(function(attributes){
                                //console.log("Section Attributes");
                                //console.log(attributes);

                                $.getJSON("data/" + termCode + "/xlst.json?p=" + paramStringHour, function(){

                                }).done(function(xlsts){
                                    //console.log("Xlsts");
                                    //console.log(xlsts);
                                        
                                    $.getJSON("data/" + termCode + "/cohorts.json?p=" + paramStringHour, function(){
                                    
                                    }).done(function(cohorts){
                                        //console.log("Cohorts");
                                        //console.log(cohorts);
                                        

                                        wholeShebang.forEach(course => {
                                        
                                            const sectionsArray = new Array();
                                            sections.forEach(section => {
                                                comparisonsCount ++;
                                                if(section.sectSubjCode == course.crseSubjCode && section.sectCrseNumb == course.crseCrseNumb){
                                                    sectionsArray.push(section);
                                                }   
                                            });
                                            sectionsArray.forEach(section => {
                                                const meetingsArray = new Array();
                                                meetings.forEach(meeting =>{
                                                    comparisonsCount ++;
                                                    if(meeting.CRN == section.sectCrn){
                                                        meetingsArray.push(meeting);
                                                    }
                                                });
                                                section.sectMeetings = meetingsArray;
                                                
                                                const instructorsArray = new Array();
                                                instructors.forEach(instructor =>{
                                                    comparisonsCount ++;
                                                    if(instructor.SIRASGN_CRN == section.sectCrn){
                                                        instructorsArray.push(instructor);
                                                    }
                                                });
                                                section.INSTRUCTORS = instructorsArray;

                                                const attributesArray = new Array();
                                                attributes.forEach(attribute =>{
                                                    comparisonsCount ++;
                                                    if(attribute.SSRATTR_CRN == section.sectCrn){
                                                        attributesArray.push(attribute);
                                                    }
                                                });
                                                section.sectAttr = attributesArray;
                                                
                                                const xlstArray = new Array();
                                                xlsts.forEach(xlst =>{
                                                    comparisonsCount ++;
                                                    if(xlst.SEARCH_CRN == section.sectCrn){
                                                        xlstArray.push(xlst);
                                                    }
                                                });
                                                section.XLST = xlstArray;
                                                
                                                const cohortsArray = new Array();
                                                if(section.COHORT_RESTRICTED_IND == "Y"){
                                                    cohorts.forEach(cohort =>{
                                                        comparisonsCount ++;
                                                        if(cohort.SSRRCHR_CRN == section.sectCrn){
                                                            cohortsArray.push(cohort);
                                                        }
                                                    });
                                                }
                                                section.COHORTS = cohortsArray;
                                            });
                                            course.SECTIONS = sectionsArray;
                                        });


                                        scheduleJSON = wholeShebang;
                                        
                                        //console.log(scheduleJSON);
                                        
                                        //console.log("Ready");

                                        //console.log(comparisonsCount + "Comparisons");

                                        //trigger search if term was changed from #term-select
                                        if(termChange == true){
                                            termChange = false;
                                            triggerSearch();
                                        }
                                        
                                        const hideInaSec = setTimeout(function(){
                                            spinnerModal.hide();
                                        }, 500);
                                    
                                    });

                                });
                            });
                        });
                    });
                });

            });*/
        }

        function loadCollegeSelect(term){
            const date = new Date();
            const dayParam = date.getFullYear().toString() + date.getMonth().toString() + date.getDate().toString();
            $.getJSON("data/campus.json?p=" + dayParam, function(){
            }).done(function(campuses){populateCampus(campuses);});
        }

        function loadPTRMSelect(term)
        {
            const date = new Date();
            const dayParam = date.getFullYear().toString() + date.getMonth().toString() + date.getDate().toString();
            $.getJSON("data/ptrm.json?p=" + dayParam, function(){
            }).done(function(ptrms){populatePrtms(ptrms);});
        }

        function loadSubjectsSelect(term, camp=1){
            const college = $("#college-select").val();
            const date = new Date();
            const dayParam = date.getFullYear().toString() + date.getMonth().toString() + date.getDate().toString();
            $.getJSON("data/subjects.json?p=" + dayParam, function(){

            }).done(function(subjects){
                //console.log("SUBJECTS:");
                //console.log(subjects);

                //console.log(subjects[0].subjCode + " " + subjects[0].subjDesc + " " + subjects[0].COLL_CODE);
                populateSubjects(subjects);
        

            });

        }

        function loadInstructorsSearch(){
            $("#instructor-input").val("");
            $("#instructor-input-email").val("");
            //spinnerModal.show();
            const term = $("#term-select").val();
            const college = $("#college-select").val();
            const date = new Date();
            const dayParam = date.getFullYear().toString() + date.getMonth().toString() + date.getDate().toString();
            $.getJSON("data/instructors.json?p=" + dayParam, function(){

            }).done(function(instructors){
                //console.log("INSTRUCTORS:");
                //console.log(instructors);
                //console.log(college);
                filteredInstructors = new Array();
                filteredInstructors = instructors;

                /*if(college == "ALL"){
                    //console.log("college: " + college);
                    filteredInstructors = instructors;
                }else if(college == "1"){
                    instructors.forEach(instructor =>{
                        if(instructor.MC_INSTRUCTOR_IND == "Y"){
                            filteredInstructors.push(instructor);
                        }
                    })
                }else if(college == "2"){
                    instructors.forEach(instructor =>{
                        if(instructor.WV_INSTRUCTOR_IND == "Y"){
                            filteredInstructors.push(instructor);
                        }
                    });
                }*/
                
                instructorsJSON = filteredInstructors;
                //spinnerModal.hide();
                //populateInstructors(instructors);
            })
        }

        var status = "ALL";
        $(document).ready(function(){

            populateGESelects("csuge");
            populateGESelects("igetc");
            //looking for "https://blahblah.com/?college=wv" or ?college=mc
            //console.log("college params");
            const url = new URL(window.location.href);
            const collegeParam = url.searchParams.get("college");
            const termParam = url.searchParams.get("term");
            let subjParam = url.searchParams.get("subj");
            const startParam = url.searchParams.get("start");
            const lengthParam = url.searchParams.get("length");
            const instrParam = url.searchParams.get("instr");
            const creditType = url.searchParams.get("credittype")
           // console.log(collegeParam);
           // console.log(termParam);
           // console.log(subjParam);
           if(instrParam){
            if(instrParam.toUpperCase() == "SYNC"){
                $("#flexRadioInstrMethod1").attr("checked", "true");
                $("#flexRadioInstrMethod2").attr("checked", "true");
                $("#flexRadioInstrMethod6").attr("checked", "true");
                $("#flexRadioInstrMethod5").attr("checked", "true");
                //$("#instr-method-button").text("INP HYB FLX SON");
            }
           }
           if(lengthParam){
                if(lengthParam.toUpperCase() == "S"){
                    $("#dropdownMenuButtonSessions").text("Short-Term");
                    $("#flexRadioSessions2").attr("checked", "true");
                    
                }
                else if(lengthParam == "1"){
                    $("#dropdownMenuButtonSessions").text("Full-Term");
                    $("#flexRadioSessions1").attr("checked", "true");
                }
                else{
                    $("#dropdownMenuButtonSessions").text("Any");
                    $("#flexRadioSessions3").attr("checked", "true");
                }
                $("#more-options").addClass("show");
           }
           if(startParam){
                $("#start-time").val(startParam);
                const startTime = convertNumberToStandardTime(startParam);
                $("#start-time-result").text(startTime);
                $("#more-options").addClass("show");
           }

            let defaultCollege;
            if(collegeParam){
                switch(collegeParam.toUpperCase()){
                    case "1" : defaultCollege = collegeParam.toUpperCase();
                    break;
                    case "2" : defaultCollege = collegeParam.toUpperCase();
                    break;
                    default : defaultCollege = "ALL"
                }
                $("select#college-select").val(defaultCollege);
            }


            const date = new Date();
            const dayParam = date.getFullYear().toString() + date.getMonth().toString() + date.getDate().toString();
           //console.log(dayParam);
           //console.log(termParam);

            $.getJSON("data/terms.json?p=" + dayParam, function(){}).done(function(data){
               //console.log("SOBTERM");
               //console.log(data);
                data.forEach(element =>{
                    $("#term-select").append("<option value='" + element.termCode + "'>"+ element.termDesc+"</option>");
                });
                if(termParam){
                    $("#term-select").val(termParam);
                }
                
                termCode = $("#term-select").val();
                loadCollegeSelect(termCode);

                if(creditType){
                    $("#credit-select").val(creditType);
                }
                

                //load the schdule into scheduleJSON

                loadSubjectsSelect(termCode);
                loadScheduleFromTerm(termCode);
                loadInstructorsSearch();
                loadPTRMSelect(termCode);
                //loadSessions(); static data
                
            });


            $("#search-form").submit(function(event){
                event.preventDefault();
                //console.log(event);
                //console.log(event.originalEvent.submitter.value);
                status = event.originalEvent.submitter.value;
                if(status == "OPEN"){
                    $("#button-search-open").addClass("selected");
                    $("#button-search").removeClass("selected");
                    /*
                    $("#button-search-open").removeClass("btn-grn");
                    $("#button-search-open").addClass("btn-outline-success");
                    $("#button-search").removeClass("btn-outline-primary");
                    $("#button-search").addClass("btn-primary");
                    */
                }
                else{
                    $("#button-search").addClass("selected");
                    $("#button-search-open").removeClass("selected");
                    /*
                    $("#button-search-open").removeClass("btn-outline-success");
                    $("#button-search-open").addClass("btn-grn");
                    $("#button-search").removeClass("btn-primary");
                    $("#button-search").addClass("btn-outline-primary");
                    */
                }
                triggerSearch();
                jump("search-results-container");
            });
            $("#search_input_main").keyup(function(){
                if($(this).val().length != 1){
                    //$("#search-results-spinner").show();
                    //$("#search-results-container").removeClass("d-none");
                    triggerSearch();
                }
            });



            $("#college-select").change(function(){
                    loadTopNavBar();    
                    loadSubjectsSelect(termCode, $(this).val());

                    loadInstructorsSearch();
                    triggerSearch();
                    jump("search-results-container");
            });

            loadTopNavBar();

            $("#status-select").change(function(){
                triggerSearch();
                jump("search-results-container");
            });
            //Reload everything when term changes
            $("#term-select").change(function(){
                //console.log($(this).val());
                termChange = true;
                termCode = $(this).val();
                $("#search-results-container").addClass("d-none");
                loadScheduleFromTerm(termCode);
                loadInstructorsSearch();
                loadSubjectsSelect(termCode);
                loadCollegeSelect(termCode);
                loadPTRMSelect(termCode);
                //loadSessions();
            })
           
            
            checkBoxGroupSetup("flexRadioInstrMethod", "instr-method-button");
            checkBoxGroupSetup("textbookCost", "textbookDropDown");
            checkBoxGroupSetup("flexRadioMeetingDays", "meetingDropdown");
            radioGroupSetup("flexRadioSessions", "dropdownMenuButtonSessions", "L");
            checkBoxGroupSetup("flexRadioTransfer", "dropdownMenuButtonTransferability");
            
            
           //console.log(collegeParam);

            function addSpaceAfterComma(str) {
                return str.split(',').map(part => {
                    // Trim the part to remove leading/trailing spaces
                    part = part.trim();

                    return part;
                }).join(', ');//add the space at the end
            }

// Example usage:
/*
const originalString = "apple,banana,orange";
const modifiedString = addSpaceAfterComma(originalString);
console.log(modifiedString); // Output: "apple, banana, orange"
*/



            
            if(subjParam){
                if(subjParam.toUpperCase() != "ALL" ){
                    subjectOnly = true;
                    subjParam = addSpaceAfterComma(subjParam);
                    //console.log(subjParam);
                    $("#search_input_main").val(subjParam);
                }
                

                const loadSubjectFromParam = function(){
                    setTimeout(function(){
                        if(scheduleJSON){
 
                            triggerSearch();
                            jump("search-results-container");
                        }
                        else loadSubjectFromParam();
                    }, 200);
                    
                }
                loadSubjectFromParam();

                
            }
            
            
            
        });

        const loadTopNavBar = function(){
            const college = $("#college-select").val();
            let src;
            let alt;
            let href;
            let cssPath;
            switch(college){
                case "ALL" : 
                    src = "stacked-logo.svg";
                    alt = "North Orange County community College";
                    href = "https://www.nocccd.edu/themes/custom/north_orange/assets/img/";
                    cssPath = "/css/combined/bootstrap.min.css";
                    break;
                case "CC" :
                    src = "c-logo.svg";
                    alt = "Cypress College";
                    href = "https://www.cypresscollege.edu";
                    cssPath = "/css/wv/bootstrap.min.css";
                    break;
                case "FC" :
                    src = "f-logo.svg";
                    alt = "Fullerton College";
                    href = "https://fullcoll.edu";
                    cssPath = "/css/wv/bootstrap.min.css";
                    break;
                case "NOCE" :
                    src = "NOCE-logo.png";
                    alt = "North Orange Continuing Education";
                    href = "https://noce.edu";
                    cssPath = "/css/mc/bootstrap.min.css";
                    break; 
                default :
                    src = "stacked-logo.svg";
                    alt = "North Orange County Community College";
                    href = "https://www.nocccd.edu/themes/custom/north_orange/assets/img/";
                    cssPath = "/css/combined/bootstrap.min.css";
                    break;
  
            }
            $("#top-navbar a.navbar-brand").attr("href", href);
            $("#top-navbar a.navbar-brand img").attr("src", href+src);
            $("#top-navbar a.navbar-brand img").attr("alt", alt);
            // $('head').append('<link rel="stylesheet" type="text/css" href="'+cssPath+'">'); // Commented out - Bootstrap already loaded from CDN

        }

        const populateGESelects = function(attrCode){
            //attr codes: CSUGE, IGETC
            const codeLower = attrCode.toLowerCase();
            const codeUpper = attrCode.toUpperCase();
            const date = new Date();
            const dayParam = date.getFullYear().toString() + date.getMonth().toString() + date.getDate().toString();
            $.getJSON("data/" + codeLower + ".json?p=" + dayParam, function(){

            }).done(function(data){
                //$("#csuge-list").html("");
                $("#"+codeLower+"-list").html("");
                
                //console.log(codeLower);
                //console.log(data);
                //let igetcIndex = 1;
                let i = 1;
                data.forEach(element =>{
    
                    const code = element.attrCode;
                    const desc = element.attrDesc;

                    //const checkBox = createCheckBox("flexRadioIGETC", desc, code, igetcIndex);
                    const checkBox = createCheckBox("flexRadio" + codeUpper, desc, code, i);
                    $("#"+codeLower+"-list").append(checkBox);
                    i ++;

                });
                checkBoxGroupSetup("flexRadio"+codeUpper, "dropdownMenuButton"+codeUpper);
                //checkBoxGroupSetup("flexRadioCSUGE", "dropdownMenuButtonCSUGE");
            });
        }

        const createCheckBox = function(nameId, label, value, index){
            return('<li class="dropdown-item"><div class="form-check"><input class="form-check-input" type="checkbox" name="'+nameId+'" value="'+value+'" id="'+nameId+index+'"><label class="form-check-label" for="'+nameId+index+'">'+value+'. '+label+'</label></div></li>');
        }

        const checkBoxGroupSetup = function(nameId, buttonId){     
            $("input:checkbox[name="+ nameId+"]").click(function(){
                let resultText = "";
                $("input:checkbox[name="+nameId+"]:checked").each(function(){
                    //methodsVals.push($(this).val());
                    resultText += $(this).val() + " ";
                });
                $("#"+buttonId).text(resultText);
                triggerSearch();
                jump("search-results-container");
            });
            $("input:checkbox[name="+ nameId+"]").change(function(){

                let resultText = "";
                $("input:checkbox[name="+nameId+"]:checked").each(function(){
                    //methodsVals.push($(this).val());
                    resultText += $(this).val() + " ";
                });
                $("#"+buttonId).text(resultText);
                triggerSearch();
                jump("search-results-container");
            });
        }

        const radioGroupSetup = function(nameId, buttonId, vL){     
            $("input:radio[name="+ nameId+"]").click(function(){
                let resultText = "";
                $("input:radio[name="+nameId+"]:checked").each(function(){
                    //methodsVals.push($(this).val());
                    if(vL == "L"){ //show label instead of value
                        resultText += $('label[for="'+$(this).attr('id')+'"]').text();
                    }
                    else{
                        resultText += $(this).val() + " ";
                    }
                });
                $("#"+buttonId).text(resultText);
                triggerSearch();
                jump("search-results-container");
            });
        }

        const getCoursesSubjSearch = function(courses, searchArray){
            //split the searchArray into groups word/number groups
            //console.log("subject-select value:");
            subjectSelected = $("#subject-select").val();
            //console.log(subjectSelected);
            //console.log(subjectSelected.length);

            
            const wordArray = new Array();
            const numbArray = new Array();
            searchArray.forEach(searchString =>{
                if(/\d/.test(searchString)){
                    numbArray.push(searchString);
                }
                else if(searchString.length > 0){
                    wordArray.push(searchString);
                }
            });
            //console.log("Words");
            //console.log(wordArray);
            //console.log(numbArray);
            
            if(subjectSelected.length == 0){
                //we only make guesses if the subject is not selected
                wordArray.forEach(word =>{
                    switch (word.toLowerCase()){
                        case "psych":wordArray.push("psy", "psyc");
                        break;
                        case "math":wordArray.push("mat");
                        break;
                        case "acct":wordArray.push("ncbu");
                        break;
                        default:
                            //do nothing 
                        break;
                    }
                });
            }
            else{ //subject is selected
                wordArray.push(subjectSelected);

                wordArray.forEach(word =>{
                    switch (word.toLowerCase()){
                        case "acct":wordArray.push("ncbu");
                        break;
                        default:
                            //do nothing 
                        break;
                    }
                });
            }
            //console.log(wordArray);
            //console.log("Numbers");
            //console.log(numbArray);

            const wordMatchArray = new Array();
            const numberMatchArray = new Array();
            const titleNumberMatchArray = new Array();
            const titleMatchArray = new Array();
            const descMatchArray = new Array();
            const numberPartialMatchArray = new Array();
            
            const resultArray = new Array();
            //console.log("All Courses");
            //console.log(courses);
            courses.forEach(course =>{
                let wordMatch = false;
                let numberMatch = false;
                let numberPartialMatch = false;
                let titleMatch = false;
                let descMatch = false;
                //find out if exact match on subject
                wordArray.forEach(word =>{
                    //console.log(course);
                    if(word.toUpperCase() == course.crseSubjCode){
                        wordMatch = true;
                    };
                    if(course.crseTitle.toLowerCase().indexOf(word.toLowerCase()) >= 0){
                        titleMatch = true;
                    };
                    /**need to mod to match, search title */
                    /*if(course.CATALOG_DESC){
                        if(course.CATALOG_DESC.toLowerCase().indexOf(word.toLowerCase()) >= 0){
                            descMatch = true;
                        }
                    }*/
                });
                //find out if exact match on number
                numbArray.forEach(number => {
                    if(number.toUpperCase() == course.crseCrseNumb){
                        numberMatch = true;
                    }
                    if(course.crseCrseNumb.toLowerCase().indexOf(number.toLowerCase()) >= 0){
                        numberPartialMatch = true;
                        
                    }
                });
                //if both match, push immediately and go to next in loop
                if(wordMatch == true && (numberMatch == true || numberPartialMatch == true)){
                    resultArray.push(course);
                }//find lesser matches and save them to be added later

                else if(wordMatch == true){
                    wordMatchArray.push(course);
                }
                
                else if((titleMatch == true && numberMatch == true) || (titleMatch == true && numberPartialMatch == true)){
                    titleNumberMatchArray.push(course);
                }
                
                else if(titleMatch == true){
                    titleMatchArray.push(course);
                }
                else if(numberMatch == true){
                    numberMatchArray.push(course);
                }
                else if(descMatch == true){
                    descMatchArray.push(course);
                }
                else if(numberPartialMatch == true){
                    numberPartialMatchArray.push(course);
                }
                
            });
            wordMatchArray.forEach(course =>{
                resultArray.push(course);
            });
            if(subjectSelected.length == 0 && subjectOnly == false){ //subject is not selected
                titleNumberMatchArray.forEach(course =>{
                    resultArray.push(course);
                });
                
                titleMatchArray.forEach(course =>{
                    resultArray.push(course);
                });
                numberMatchArray.forEach(course => {
                    resultArray.push(course);
                });
                descMatchArray.forEach(course => {
                    resultArray.push(course);
                });
                numberPartialMatchArray.forEach(course => {
                    resultArray.push(course);
                });
            }
            //console.log("Results to return");
            //console.log(resultArray);
            subjectOnly = false;
            return resultArray;
        };

        const executeSearch = function(){
            //process initial search string
            searchString = $("#search_input_main").val();
            
           //console.log(searchString);
            searchString = searchString.replace("-", " ");
            searchString = searchString.replace(",", " ");
            searchString = searchString.replace(";", " ");
            //break up search string into an array of strings
            const searchArray = searchString.split(" ");
            //separate alphanumeric strings                
            let i = 0;
 
            searchArray.forEach(element => {
                const insert = element.match(/[a-z]+|\d{1,4}[a-z]{0,3}|\d+/ig);
                if(insert){
                    searchArray.splice(i, 1);
                    //console.log(searchArray);
                    insert.forEach(element =>{
                        searchArray.push(element);
                    });
                }
                i++;
            });
            

            //TERM
            const term = $("#term-select").val();
            //console.log("term: "+term);
            //COLLEGE                
            const college = $("#college-select").val();
            //console.log("college: "+college);
            //SUBJECT
            const subject = $("#subject-select").val();
            //console.log("manually chosen subject: " + subject);
            //console.log(scheduleJSON);
            
            const scheduleJSONCopy = JSON.parse(JSON.stringify(scheduleJSON));

            //const courseList = searches.courseList[searchCount];
            let coursesList;
            //console.log(searchArray.length);
            let emptySearch = true;
            searchArray.forEach(element =>{
                if(element.length > 0){
                    emptySearch = false;
                }
            })
            if(emptySearch == true){
                coursesList = scheduleJSONCopy;
            }
            else{
                //console.log('subject search');
                //console.log(searchArray);
                coursesList = getCoursesSubjSearch(scheduleJSONCopy, searchArray);
            }

            

            //INSTRUCTIONAL METHODS
            let instrMethods = getArrayFromCheckboxes("flexRadioInstrMethod");
            //console.log(instrMethods);
            //const instructor = $("#instructor-input-email").val();
            const instructor = $("#instructor-input").val();
            //console.log("Instructor: " + instructor);
            //TEXTBOOK COST
            const textbookCost = getArrayFromCheckboxes("textbookCost");
            //MEETING DAYS
            const meetingDays = getArrayFromCheckboxes("flexRadioMeetingDays");
            //console.log("Meeting Days");
            //console.log(meetingDays);
            //SESSIONS
            //const sessions = $("[name='flexRadioSessions']:checked").val()
            //console.log("Sessions");
            //console.log(sessions);
            //part-of-term
            const ptrms = getArrayFromCheckboxes("flexRadioPTRM");
            //TRANSFER
            const transferability = getArrayFromCheckboxes("flexRadioTransfer");
            //CSU GE
            const csuge = getArrayFromCheckboxes("flexRadioCSUGE");
            //IGETC
            const igetc = getArrayFromCheckboxes("flexRadioIGETC");
            const startTime = convertNumberToMilitaryTime($("#start-time").val());
            const endTime = convertNumberToMilitaryTime($("#end-time").val());
            //console.log("Start");
            //console.log(startTime);
            //console.log("End");
            //console.log(endTime);

            //CREDIT TYPE
            const credit_type = $("#credit-select").val();
            //console.log("Credit Type");
            //console.log(credit_type);

          
            const units = $("#units-input").val();
            //console.log("units: " + units);

            
            /*
                put all conditions for removal through one loop
            */
            const coursesLength = coursesList.length;
            //console.log("Before filter: " + coursesLength );
            //const status = $("#status-select").val();
            let spliceCount = 0;
            let sectionsSpliced = 0;
            for(let i = coursesLength - 1; i >= 0; i--){
                    let sectionsLength = coursesList[i].SECTIONS.length;
                    let sectionsRemaining = sectionsLength;
                    let removeCourse = false;
                    //College Fitering
                    if(college != "ALL"){
                        if(college.substring(0, 1) == "1"){
                            if(coursesList[i].crseCrseNumb.slice(-1) != "C"){
                                removeCourse = true;
                                sectionsLength = 0; //prevent it from trying to loop below.
                                
                            }
                        }
                        else if(college.substring(0, 1) == "2"){
                            if(coursesList[i].crseCrseNumb.slice(-1) != "F"){
                                removeCourse = true;
                                sectionsLength = 0; //prevent it from trying to loop below. 
                            }
                        }
                       else{
                        if(coursesList[i].crseCrseNumb.slice(-1) == "F" || coursesList[i].crseCrseNumb.slice(-1) == "C"){
                                removeCourse = true;
                                sectionsLength = 0; //prevent it from trying to loop below. 
                        }
                       }         
                    }
                    //console.log(status);
                    for(let j = sectionsLength - 1; j >= 0; j--){
                        const section = coursesList[i].SECTIONS[j];
                        let removeSection = false;
                        //STATUS
                        //Open/Waitlist filtering - this needs testing
                        if(status == "OPEN"){
                            const now = Date.now();
                            const cutOffDate = Date.parse(section.sectEnrlCutOffDate);
                            //console.log("now " + now);
                            //console.log("cutoff " + cutOffDate); 
                            
                            if(section.sectSeatsAvail <= 0 || now > cutOffDate ){
                              // console.log("Removing " + section.sectCrn);
                                removeSection = true;
                            }
                        }
                        else if(status == "WAIT"){
                            if(section.sectSeatsAvail <= 0 && section.sectWaitCount < 1){
                            //console.log("Section Closed" + j);
                            removeSection = true;
                            }
                        }

                        if(igetc.length > 0){
                            //console.log("igetc filter detected");
                            let found = false;
                            section.sectAttr?.forEach(attribute =>{
                                igetc.forEach(value =>{
                                    if(attribute.attrCode == value){
                                        found = true;
                                    }
                                });
                            });
                            if(found == false){
                                removeSection = true;
                            }
                            
                        }
                        if(csuge.length > 0){
                            //console.log("csuge filter detected");
                            let found = false;
                            section.sectAttr?.forEach(attribute =>{
                                csuge.forEach(value =>{
                                    if(attribute.attrCode == value){
                                        found = true;
                                    }
                                });
                            });
                            if(found == false){
                                removeSection = true;
                            }
                            
                        }
                        if(transferability.length > 0){
                            //console.log("tranfserability filter detected");
                            let found = false;
                            let csuFound = false;
                            let ucFound = false;
                            section.sectAttr?.forEach(attribute =>{
                                transferability.forEach(value =>{
                                    if(attribute.attrCode == value){
                                        found = true;
                                    }
                                    if(attribute.attrCode == "UC"){
                                        ucFound = true;
                                    }
                                    if(attribute.attrCode == "CSU"){
                                        csuFound = true;
                                    }
                                    if(value == "BOTH"){
                                        if(ucFound == true && csuFound == true){
                                            found = true;
                                        }
                                        else{
                                            found = false;
                                        }
                                    }
                                });
                            });
                            if(found == false){
                                removeSection = true;
                            }
                            
                        }
                        //Textbook Cost
                        if(textbookCost.length > 0){
                            //textbookCost = checked checkbox values
                            //console.log(textbookCost);
                            let found = false;
                            const ztcs = [];
                            if(textbookCost.includes("ZTC")){
                                ztcs.push("ZTCP");
                                ztcs.push("OER");
                                ztcs.push("NSC");
                            }
                            if(textbookCost.includes("LTC")){
                                ztcs.push("LTC");
                            }
                            //if(Object.hasOwn(section, 'sectAttr'))
                            //{
                                section.sectAttr?.forEach(attribute =>{
                                //console.log(attribute);
                                //console.log(attribute.attrCode);
                                    if(ztcs.includes(attribute.attrCode)){
                                        found = true;
                                    }
                                });
                            //}
                            
                            /*
                                textbookCost.forEach(value =>{
                                    
                                    /*if(ztcs.includes(value)){
                                        found = true;
                                    }
                                   /* if(attribute.attrCode == value){
                                        found = true;
                                    }
                                    
                                });
                                */
                            if(found == false){
                                removeSection = true;
                            }
                        }
                        /**instruction method
                         * ONLINE - ONL : ('72', '72L', 'EMO')				
                        HYbrid - HYB : ('HYA', 'HYS', 'HYO', 'HY', 'HYL')
                        Live Zoom- LZO : 71
                        on campus - ONC : 02
                         
                        let ONL =  ['72', '72L', 'EMO'];
                        let HYB = ['HYA', 'HYS', 'HYO', 'HY', 'HYL']	
                        let LZO = '71';
                        let ONC = '02';
                        update this in package to just output the right instruction method.
                        */ 
                        if(instrMethods.length > 0){
                            //console.log(instrMethods)
                            //console.log(section.sectSchdCode);
                            let found = false;
                            instrMethods.forEach(value =>{
                                if(section.sectSchdCode == value){
                                    found = true;
                                }
                                /*if(ONL.includes(section.sectSchdCode)){if(value='ONL'){found=true;}}
                                if(HYB.includes(section.sectSchdCode)){if(value='HYB'){found=true;}}
                                if(section.sectSchdCode = LZO){if(value='LZO'){found=true;}}
                                if(section.sectSchdCode = ONC){if(value='ONC'){found=true;}}*/

                            });
                            
                            if(found == false){
                                removeSection = true;
                            }
                        }
                        if(instructor){
                            let found = false;
                            
                            //original
                           
                            if(section.sectInstrName)
                            {
                                console.log(section.sectInstrName);
                                console.log(instructor);
                                if (section.sectInstrName.toLowerCase() == instructor.toLowerCase()){
                                        found = true;
                                    }
                            }
                            
                            if(found == false){
                                removeSection = true;
                            }
                        }
                        if(ptrms.length > 0){
                            //console.log("part of term");
                            //console.log(section.sectPtrmCode);
                            let found = false;
                            if (ptrms.includes(section.sectPtrmCode))
                            {
                                found = true;
                            }
                            if(found == false){removeSection = true;}
   
                        }
                        
                        if(meetingDays.length > 0){
                            let found = false;
                            //console.log('********************');
                            //console.log(section.sectMeetings);
                            //if(section.sectMeetings.length > 0){
                            if (Array.isArray(section.sectMeetings)){
                                section.sectMeetings.forEach(meeting =>{
                                    /*meetingDays.forEach(meetingDay =>{
                                        if(meeting.DOW){
                                            if(meeting.DOW.indexOf(meetingDay) >= 0){
                                                found = true;
                                            }
                                        }
                                    })*/
                                    const mArry = [];
                                    if(meeting.monDay) mArry.push(meeting.monDay);
                                    if(meeting.tueDay) mArry.push(meeting.tueDay);
                                    if(meeting.wedDay) mArry.push(meeting.wedDay);
                                    if(meeting.thuDay) mArry.push(meeting.thuDay);
                                    if(meeting.friDay) mArry.push(meeting.friDay);
                                    if(meeting.satDay) mArry.push(meeting.satDay);
                                    if(meeting.sunDay) mArry.push(meeting.satDay);
                                    found = includesAll(mArry, meetingDays);

                                    /*search for time as well */
                                    if(meeting.beginTime != null && meeting.beginTime < startTime){
                                        //console.log("Starting time: " + meeting.beginTime);
                                        //console.log("removing " + section.sectCrn);
                                        removeSection = true;
                                    }
                                    if(meeting.endTime != null && meeting.endTime > endTime){
                                        //console.log("End time: " + meeting.endTime);
                                        //console.log("removing " + section.sectCrn);
                                        removeSection = true;
                                    }

                                    
                                })
                            }
                            if(found == false){
                                removeSection = true;
                            }
                        }
                        //console.log("Section:");
                       // console.log(section);
                        /*section.sectMeetings.forEach(meeting =>{
                            if(meeting.beginTime != null && meeting.beginTime < startTime){
                                console.log("Starting time: " + meeting.beginTime);
                                console.log("removing " + section.sectCrn);
                                removeSection = true;
                            }
                            if(meeting.endTime != null && meeting.endTime > endTime){
                                console.log("End time: " + meeting.endTime);
                                console.log("removing " + section.sectCrn);
                                removeSection = true;
                            }
                        })*/

                        //credit is course level
                       /* if(section.sectCredHrs == 0 && credit_type == 'CR'){
							removeSection = true;
				    	}
                        if(section.sectCredHrs > 0 && credit_type == 'NC'){
							removeSection = true;
				    	}*/				    	

                        if(removeSection == true){
                            sectionsRemaining --;
                            sectionsSpliced ++;
                            coursesList[i].SECTIONS.splice(j, 1);
                        }
                        
                        
                    }
                    if(sectionsRemaining == 0){
                            removeCourse = true;
                    }
                    if(removeCourse == true){
                        coursesList.splice(i, 1);
                        spliceCount ++;
                    }
                    
                }
            

            //console.log("Splice Count: "+ spliceCount);
            //console.log("Sections Spliced: " + sectionsSpliced );
            //console.log("coursesList length");
            //console.log(coursesList.length);
            //console.log(coursesList);

            courseSearchResults = coursesList;
            //console.log("before load");
            //console.log(courseSearchResults.length);

			//CRN Search
			if(searchString.length == 5 && searchString > '10000' && searchString < '99999'){
				$(scheduleJSON).each( function(q, s){
					$(this['SECTIONS']).each( function(k, v){
						if(v['CRN'] == searchString){
							//console.log('CRN Search');
							courseSearchResults = [s];
							loadSearchResultsToPage(0);
							
						}
					});
				});
				$("#search-results-spinner").hide();
			}else{
			
				//get json from term
                //console.log("hello");
				loadSearchResultsToPage(0);
			}
        }

        function triggerSearch(){
            $("#search-results-spinner").show();
            $("#search-results-container").removeClass("d-none");
            executeSearch();
                
        }

        $(document).ready(function(){
            $("#instructor-input").keyup(function(){
                console.log('firing');
                const searchString = $(this).val();
                //console.log(searchString.length);
                if(searchString.length < 1){
                    $("#instructor-input-email").val("");
                    return;
                }
                
                //console.log(instructorsJSON);
                let resultString = "";
                const instructorsArrayLength = instructorsJSON.length > 20 ? 20 : instructorsJSON.length; 
                let instructorsFound = 0;
                let i = 0;
                while (i < instructorsJSON.length && instructorsFound <= 20){
                
                    if(instructorsJSON[i].instrFirstName.toLowerCase().indexOf(searchString.toLowerCase()) >= 0 || instructorsJSON[i].instrLastName.toLowerCase().indexOf(searchString.toLowerCase()) >= 0){
                        //instructors_array.push(instructors_json[i]);
                        resultString = resultString + "<button class='dropdown-item' value="+instructorsJSON[i].INSTRUCTOR_EMAIL+">" + instructorsJSON[i].instrLastName + ", " +instructorsJSON[i].instrFirstName + "</button>";
                        instructorsFound ++;
                    }
                    i++;
                }
                $("#instructor-drop-down").html("<li class='dropdown-item'>Results</li>");
                $("#instructor-drop-down").append(resultString);
               // $("#instructor-drop-down").addClass("show");
               $("#instructor-drop-down .dropdown-item").click(function(){
                    //console.log($(this).val());
                    $("#instructor-input").val($(this).text());
                    $("#instructor-input-email").val($(this).val());
                    triggerSearch();
                    jump("search-results-container");
                });
            });

            $("#units-input").change(function(){
                //console.log($(this).val());
                $("#units-max").text($(this).val());
            });

            
            $("#subject-select").change(function(){
                $("#search_input_main").val($(this).val());
                //console.log($(this).val());
                triggerSearch();
                jump("search-results-container");
            });

        });
            



        
        const reloadResults = function(min){
            $("#search-results-spinner").show();
            loadSearchResultsToPage(min);
        }

        $("#results-pagination-previous").click(function(){
            reloadResults($(this).data("min"));
        });
        $("#results-pagination-next").click(function(){
                reloadResults($(this).data("min"));
        });
        $("#results-pagination-previous-bottom").click(function(){
            reloadResults($(this).data("min"));
			document.getElementById('results-display-count').scrollIntoView(true);
        });
        $("#results-pagination-next-bottom").click(function(){
                reloadResults($(this).data("min"));
				document.getElementById('results-display-count').scrollIntoView(true);
        });
        const getinstrModeDescription = function(mode){
            if (mode == "02" || mode == "04" || mode == "04E" ){
                return "All instruction occurs in-person at an assigned location.";
            }
            if (mode == "20" ){
                return "Work Experience.";
            }
            if (mode == "40" ){
                return "Indep Study.";
            }
            if(mode == "HY"){
                return "Instruction occurs in-person, but students also have the option to attend via online synchronous videoconference. ";
            }
            if(mode == "71"){
                return "Instruction occurs in-person, but students also have the option to attend via online synchronous videoconference. ";
            }
            if(mode == "72"){
                return "All instruction occurs online, with no requirements for online synchronous videoconferences.";
            }
            if(mode == "72L"){
                return "All instruction occurs online, with required attendance at synchronous videoconferences. ";
            }
            if(mode == "90"){
                return "Field Experience.";
            }
            if(mode == "EMO"){
                return "All instruction occurs online, with required attendance at synchronous videoconferences. ";
            }
           


        }
        const loadSearchResultsToPage = function(min){

            courses = courseSearchResults;
            //console.log("loading method");
            //console.log(courses.length);
            const maxLength = 25;
            //const min = 50;
            let max = min + maxLength;
            let prev = min - maxLength;
            if(prev < 0 ){prev = 0;}
            if (courses.length < max ){
                max = courses.length;
                $("#results-pagination-next").prop("disabled", true);
				$("#results-pagination-next-bottom").prop("disabled", true);
            }
            else{
                $("#results-pagination-next").data("min", max);
                $("#results-pagination-previous").data("min", prev);
                $("#results-pagination-next").prop("disabled", false);
				
				$("#results-pagination-next-bottom").data("min", max);
                $("#results-pagination-previous-bottom").data("min", prev);
                $("#results-pagination-next-bottom").prop("disabled", false);
                
            }
            if(min > 0){
                $("#results-pagination-previous").prop("disabled", false);
				$("#results-pagination-previous-bottom").prop("disabled", false);
                
            }
            else{
                $("#results-pagination-previous").prop("disabled", true);
				$("#results-pagination-previous-bottom").prop("disabled", true);
            }
            const minDisplayed = min + 1;
            const maxDisplayed = max;
            
            
            $("#results-total-count").text(courses.length);
            $("#results-display-count").text(minDisplayed + " - " + maxDisplayed);
			
			$("#results-total-count-bottom").text(courses.length);
            $("#results-display-count-bottom").text(minDisplayed + " - " + maxDisplayed);
            
            //console.log(courses);

            //$("#term-desc").text(courses.TERM_DESC);
            $("ul#class-search-results").html(""); //clear it
            //Populate outline
            
            
            for(let i = min; i < max; i ++){

                /*
                if(courses[i].dnu == true){
                    console.log("dnu is true");
                    coursesCount --;
                    i++;
                    continue;
                }
                */
                const sections = courses[i].SECTIONS;
                const sectionsLengthLabel = (sections.length == 1) ? " Section" : " Sections";
                $('ul#class-search-results').append('<li><div class="card mb-4 course-card" id="course-'+i+'-card"></div></li>');
                
                $('#course-'+i+'-card').html('<div class="card-header bg-primary text-white"><div class="row"><div class="col-9 align-self-start"><h3 class="fs-5 text-white m-auto"><span id="course-'+i+'-subj"></span> <span id="course-'+i+'-crse"></span>: <span id="course-'+i+'-title"></span></h3></div><div class="col-3 align-self-end text-end"><span id="course-'+i+'-units"></span></div></div></div><div class="card-header bg-light text-dark"><div class="row"><div class="col align-self-start"><span id="course-'+i+'-college"></span></div></div><div><span id="course-'+i+'-description"></span></div></div>');
                //show/hide sections button
                $('#course-'+i+'-card').append('<div class="p-3"><button id="course-'+i+'-sections-show" data-bs-toggle="collapse" data-bs-target="#course-'+i+'-sections" class="btn btn-primary bi-caret-down-fill" aria-expanded="false" aria-controls="course-'+i+'-sections">Show Sections</button><button id="course-'+i+'-sections-hide" data-bs-toggle="collapse" data-bs-target="#course-'+i+'-sections" class="btn btn-primary bi-caret-up-fill" aria-expanded="false" aria-controls="course-'+i+'-sections" style="display: none;">Hide Sections</button><span class="badge bg-success">' + sections.length + sectionsLengthLabel + '</span></div>');

                $('#course-'+i+'-sections-show').click(function(){
                    
                    $(this).hide();
                    $('#course-'+i+'-sections-hide').show();
                });
                $('#course-'+i+'-sections-hide').click(function(){
                    $(this).hide();
                    $('#course-'+i+'-sections-show').show();
                });
                let college_code = 0;
                if(courses[i].crseCrseNumb.slice(-1).toLowerCase() == 'c'){
					college_name = "Cypress College";
                    college_code = 'c';
                    
                }
				else if(courses[i].crseCrseNumb.slice(-1).toLowerCase() == 'f'){
					college_name = "Fullerton College";
                    college_code = 'f';
				}
                else{college_name = "NOCE";college_code = 'noce';}
                logo_url = '<img style="position:relative;" src="image/' + college_code +  '_logo.png" height="90px" class="border bg-white mb-4"/>';
				
                $('#course-'+i+'-subj').text(courses[i].crseSubjCode); 
                //console.log('course header subject code');
                //console.log(courses[i]);
                //$('#course-'+i+'-crse').text(courses[i].crseCrseNumb); //old course numbering
                //common course numbering
				if (courses[i].crseAlias){$('#course-'+i+'-crse').text(courses[i].crseAlias)}
                else{$('#course-'+i+'-crse').text(courses[i].crseCrseNumb);}
                let course_title = courses[i].crseLongTitle ? courses[i].crseLongTitle : courses[i].crseTitle;
                $('#course-'+i+'-title').text(course_title);
                $('#course-'+i+'-college').html(logo_url + ' ' + '<span class="fs-5">' + college_name + '</span>');
                $('#course-'+i+'-description').text(courses[i].crseLongText);
                let units = courses[i].crseCredHrLow;
                let unitsLabel = " units";
                const unitsNumber = parseFloat(courses[i].crseCredHrLow);
                if( unitsNumber == 1) unitsLabel = " unit";
                if(courses[i].crseCredHrInd){
                    units = units + " - " + courses[i].crseCredHrHigh;
                    unitsLabel = " units";
                }
                if(unitsNumber > 0){
                    $('#course-'+i+'-units').text(units + unitsLabel);
                }
                else{
                    $('#course-'+i+'-units').text("Noncredit");
                }
                

                
                $('#course-'+i+'-card').append('<div><ul class="list-group collapse" id="course-'+i+'-sections"></ul></div>');
                
                $('ul#course-'+i+'-sections').html('');
                for(let j = 0; j < sections.length; j++){
                    
                    
                    const section = sections[j];
                    $('#course-'+i+'-sections').append('<li class="list-group-item section-card" id="course-'+i+'-section-'+j+'-card"><div class="card-header bg-light text-dark" id="course-'+i+'-section-'+j+'-card-header"></div></li>');
                    
                    $('#course-'+i+'-section-'+j+'-card-header').html('<div class="row" id="course-'+i+'-section-'+j+'-row"></div>'); 
                    //add columns to row
                    
                    //CRN
                    $('#course-'+i+'-section-'+j+'-row').html('<div ><h4>Section / CRN: <span id="course-'+i+'-section-'+j+'-crn"></span></h4></div>');
                    $('#course-'+i+'-section-'+j+'-crn').text(section.sectCrn); 

                    //Instructors
                    $('#course-'+i+'-section-'+j+'-row').append('<div class="col-sm"><div>Instructor <span id="course-'+i+'-section-'+j+'-instructors"></span></div></div>');

                    //Mode
                    $('#course-'+i+'-section-'+j+'-row').append('<div class="col-sm"><div>Instructional Mode</div><div><span id="course-'+i+'-section-'+j+'-mode"></span></div></div>');
                    const modeDesc = getinstrModeDescription(section.sectSchdCode);
                    //console.log("section part:");
                    //console.log(section);
                    const modeHTML = section.sectSchdCode + ' <a tabindex="0" role="button" class="btn-link" data-bs-toggle="popover" data-bs-trigger="focus" data-bs-title="'+ section.sectSchdCode +'" data-bs-content="'+ modeDesc +'"><i class="bi bi-info-circle"></i></a>';
                    
                    $('#course-'+i+'-section-'+j+'-mode').html(modeHTML);

                    
                    
    
                    //add instructors
                    $('#course-'+i+'-section-'+j+'-instructors').html("");
                    //need instructors in query
                    //for(let k = 0; k < section.INSTRUCTORS.length; k++){
                        $('#course-'+i+'-section-'+j+'-instructors').append('<div id="course-'+i+'-section-'+j+'-instructor-0-name"></div>');
                        $('#course-'+i+'-section-'+j+'-instructor-0-name').text(section.sectInstrName);
                    //}
                    
                    //Length
                    $('#course-'+i+'-section-'+j+'-row').append('<div class="col-sm"><div>Length</div><div><span id="course-'+i+'-section-'+j+'-length"></span></div></div>');
                    $('#course-'+i+'-section-'+j+'-length').text(section.sectPtrmCode);
                    
                    //Availability
                    $('#course-'+i+'-section-'+j+'-row').append('<div class="col-sm"><div>Availability</div><div class="position-relative"><span id="course-'+i+'-section-'+j+'-availability-icon" ></span><span class="ps-1"><span id="course-'+i+'-section-'+j+'-availability"></span></span></div><div id="course-'+i+'-section-'+j+'-waitlist" class="position-relative d-none"><span id="course-'+i+'-section-'+j+'-waitlist-icon" ></span><span class="ps-1"><span id="course-'+i+'-section-'+j+'-waitlist-msg"></span></span></div></div>');

                    let ztc = false;
                    let ltc = false;
                    let costDesc;
                    section.sectAttr?.forEach(attr =>{
                        if(attr.attrCode == "ZTC" || attr.attrCode == "OER" || attr.attrCode == "NSC"){
                            ztc = true;
                            costDesc = attr.attrDesc;
                        }
                        if(attr.attrCode == "LTC"){
                            ltc = true;
                            costDesc = attr.attrDesc;
                        }
                    });
                    
                    if(section.COHORT_RESTRICTED_IND == "Y"){
                        $('#course-'+i+'-section-'+j+'-row').append('<div class="col-sm">Cohort Restricted <span class="bi bi-exclamation-triangle text-danger"></span></div>');
                    }

                    if(ztc == true){
                        
                        $('#course-'+i+'-section-'+j+'-row').append('<div class="col-sm text-end-desk"><img  src="/image/ztc-75.png" alt="'+costDesc+'" title="'+costDesc+'"></div>');
                    }
                    else if(ltc == true){
                        $('#course-'+i+'-section-'+j+'-row').append('<div class="col-sm text-end-desk"><img  src="/image/ltc.png" alt="Textbook Cost under $50" title="Textbook Cost under $50"></div>');
                    }
                    

                    const max_enrl = parseInt(section.sectMaxEnrl);
                    const seats_remain = parseInt(section.sectSeatsAvail);
                    const waitlist_max = parseInt(section.SSBSECT_WAIT_CAPACITY);
                    const waitlist_actual = parseInt(section.sectWaitCount);
                    const waitlist_remain = waitlist_max - waitlist_actual;
                    let avail_msg;
                    let avail_color;
                    let waitlist_msg = "0";
                    
                    if(max_enrl == 0){
                        avail_msg = "Contact Department";
                        avail_color = "primary"; 
                    }
                        if(waitlist_actual > 0 || seats_remain <= 0){
                            avail_msg = "0/"+ max_enrl+" seats remain";
                            avail_color = "danger";
                            if(waitlist_actual < waitlist_max){
                                waitlist_msg = waitlist_actual + " on Waitlist";
                            }
                            else{
                                waitlist_msg = "Waitlist Full";
                            }
                        }
                        
                        if(seats_remain > 0){
                            const seatsRemain = (section.sectSeatsAvail == 1) ? " seat remains" : " seats remain";

                            avail_msg = section.sectSeatsAvail + "/" + section.sectMaxEnrl + seatsRemain;
                            avail_color = "success";
                        }

                    let avail_class = "bi bi-record-fill text-"+avail_color;
                    let waitlist_class = "bi bi-record-fill text-warning";
                    $('#course-'+i+'-section-'+j+'-availability-icon').addClass(avail_class);
                    $('#course-'+i+'-section-'+j+'-availability').text(avail_msg);

                    if(waitlist_msg != "0"){
                        $('#course-'+i+'-section-'+j+'-waitlist-icon').addClass(waitlist_class);
                        $('#course-'+i+'-section-'+j+'-waitlist-msg').text(waitlist_msg);
                        $('#course-'+i+'-section-'+j+'-waitlist').removeClass('d-none');
                    }





                    //End Section Header

                    

                    $('#course-'+i+'-section-'+j+'-card').append('<div class="card-body card-body-meeting" id="course-'+i+'-section-'+j+'-card-body"></div>');
                    //Meeting Schedule - table heading
                    $('#course-'+i+'-section-'+j+'-card-body').html('<table class="table"><caption>Meeting Schedule</caption><thead><tr><th scope="col">Location</th><th scope="col">Dates</th><th scope="col">Days</th><th scope="col">Times</th></tr></thead><tbody id="course-'+i+'-section-'+j+'-meeting-table-body"></tbody></table>');
                    //console.log('section');
                    //console.log(section);    
                    const meetings = section.sectMeetings;
                    //console.log("meetings");
                    //console.log(meetings);
                    $('#course-'+i+'-section-'+j+'-meeting-table-body').html('');
                    if (meetings)
                    {
                        for(let k = 0; k < meetings.length; k++){
                        let sundayIncluded = false;
                        //let dow = meetings[k].DOW;
                        //let dow =  meetDaystoArray(meetings);
                        //if (dow == null) dow = '-';
                        let daysOfClass = "";
                        let mon = tues = wed = thurs = fri = sat = "bg-light text-dark border border-secondary";
                        if(meetings[k].monDay != null) {mon = "bg-primary text-white border border-primary";
                            daysOfClass = "Monday";
                        }
                        if(meetings[k].tueDay != null) {tues = "bg-primary text-white border border-primary";
                            daysOfClass = daysOfClass.length > 1 ? daysOfClass + ", Tuesday" : "Tuesday";
                        }
                        if(meetings[k].wedDay != null) {wed = "bg-primary text-white border border-primary";
                            daysOfClass = daysOfClass.length > 1 ? daysOfClass + ", Wednesday" : "Wednesday";
                        }
                        if(meetings[k].thuDay != null) {thurs = "bg-primary text-white border border-primary";
                            daysOfClass = daysOfClass.length > 1 ? daysOfClass + ", Thursday" : "Thursday";
                        }
                        if(meetings[k].friDay != null) {fri = "bg-primary text-white border border-primary";
                            daysOfClass = daysOfClass.length > 1 ? daysOfClass + ", Friday" : "Friday";
                        }
                        if(meetings[k].satDay != null) {sat = "bg-primary text-white border border-primary";
                            daysOfClass = daysOfClass.length > 1 ? daysOfClass + ", Saturaday" : "Saturday";
                        }
                        if(meetings[k].sunDay != null) {sun = "bg-primary text-white border border-primary";
                            daysOfClass = daysOfClass.length > 1 ? daysOfClass + ", Sunday" : "Sunday";
                        }
                       /*
                        if(dow.indexOf("M") >=0){
                            daysOfClass = "Monday";
                        }
                        if(dow.indexOf("T") == 0){
                            daysOfClass = "Tuesday";
                        }
                        else if(dow.indexOf("T") >=1){
                            daysOfClass = daysOfClass +  ", Tuesday";
                        }
                        if(dow.indexOf("W") == 0){
                            daysOfClass = "Wednesday";
                        }
                        else if(dow.indexOf("W") >=1){
                            daysOfClass = daysOfClass +  ", Wednesday";
                        }
                        if(dow.indexOf("R") == 0){
                            daysOfClass = "Thursday";
                        }
                        else if(dow.indexOf("R") >=1){
                            daysOfClass = daysOfClass +  ", Thursday";
                        }
                        if(dow.indexOf("F") == 0){
                            daysOfClass = "Friday";
                        }
                        else if(dow.indexOf("F") >=1){
                            daysOfClass = daysOfClass +  ", Friday";
                        }
                        if(dow.indexOf("S") == 0){
                            daysOfClass = "Saturday";
                        }
                        else if(dow.indexOf("S") >=1){
                            daysOfClass = daysOfClass +  ", Saturday";
                        }
                        if(dow.indexOf("U") == 0){
                            daysOfClass = "Sunday";
                            sundayIncluded = true;
                        }
                        else if(dow.indexOf("U") >=1){
                            daysOfClass = daysOfClass +  ", Sunday";
                            sundayIncluded = true;
                        }*/
                        
                
                        //containers for location(ROOM), dates, days, times
                        $('#course-'+i+'-section-'+j+'-meeting-table-body').append('<tr><td><span id="course-'+i+'-section-'+j+'-meeting-'+k+'-room"></span></td><td><span id="course-'+i+'-section-'+j+'-meeting-'+k+'-dates"></span></td><td><span aria-label="'+daysOfClass+'" id="course-'+i+'-section-'+j+'-meeting-'+k+'-days"></span></td><td><span id="course-'+i+'-section-'+j+'-meeting-'+k+'-time"></span></td></tr>');

                        //days of week
                        //exclude fancy squares if Sunday class
                        if(sundayIncluded == true){
                            $('#course-'+i+'-section-'+j+'-meeting-'+k+'-days').text(daysOfClass);
                        }
                        else{
                            $('#course-'+i+'-section-'+j+'-meeting-'+k+'-days').append('<td><span class="badge '+mon+' badge-monday">M</span><span class="badge '+tues+' badge-tuesday">T</span><span class="badge '+wed+' badge-wednesday">W</span><span class="badge '+thurs+'  badge-thursday">R</span><span class="badge '+fri+' badge-friday">F</span><span class="badge '+sat+' badge-saturday">S</span></td>');
                            $('#course-'+i+'-section-'+j+'-meeting-'+k+'-days').attr("title", "Classes Meet " + daysOfClass);
                        }
                        
                        //const bldg = meetings[k].bldgeCode ? meetings[k].bldgeCode : "";
                        const bldg = meetings[k].bldgDesc ? meetings[k].bldgDesc : "";
                        const rm = meetings[k].roomCode ? meetings[k].roomCode : "";
                        //const room = bldg.substring(1,3) == rm.substring(1,3) ? rm : "<u>" + bldg + "</u> " + rm;
                        const room =  "<u>" + bldg + "</u> " + rm;
                        
                        //const room = meetings[k].BUILDING.substring(1,3) == meetings[k].ROOM.substring(1,3) ? meetings[k].ROOM : meetings[k].BUILDING + " " +meetings[k].ROOM;
                        $('#course-'+i+'-section-'+j+'-meeting-'+k+'-room').html(room);
						$('#course-'+i+'-section-'+j+'-meeting-'+k+'-room').prop("title", meetings[k].bldgeCode);
                        $('#course-'+i+'-section-'+j+'-meeting-'+k+'-dates').text(meetings[k].startDate + '-' + meetings[k].endDate);
                        
                        //$("#course-1-section-1-meeting-"+i+"-days").text(meetings[i].DOW);

                        if(meetings[k].beginTime && meetings[k].endTime){

                            const beginTime = meetings[k].beginTime;
                            let beginHour = beginTime.substr(0, 2);
                            let beginMinute = beginTime.substr(2);
                            const endTime = meetings[k].endTime;
                            let endHour = endTime.substr(0, 2);
                            let endMinute = endTime.substr(2);
                    
                            const start = convertStandardTime(beginHour, beginMinute);
                            const end = convertStandardTime(endHour, endMinute);
                            $('#course-'+i+'-section-'+j+'-meeting-'+k+'-time').text(start + " - " + end);
                        }

                           
                    
                        }
                    }
                    
                    //section details modal button
                    $('#course-'+i+'-section-'+j+'-card-body').append('<div class="footer"><button id="course-'+i+'-section-'+j+'-details-button"  data-bs-toggle="modal" data-bs-target="#section-details-modal" class="btn btn-primary" aria-expanded="false" aria-controls="section-details-modal">Section Details</button></div>');  
                    $('#course-'+i+'-section-'+j+'-details-button').val('{"course":"'+i+'", "section":"'+j+'"}');
                    
                    //details button function
                    $('#course-'+i+'-section-'+j+'-details-button').click(function(event){
                        //console.log($(this).val());
                        const jsonVal = JSON.parse($(this).val());
                        console.log(jsonVal);
                        const courseIndex = parseInt(jsonVal.course);
                        const sectionIndex = parseInt(jsonVal.section);
                        //console.log(courseIndex);
                        //console.log(sectionIndex);
                        const course = courses[courseIndex];
                        //console.log(course);
                        const section = course.SECTIONS[sectionIndex];

                        const college = (course.crseCrseNumb.endsWith(" C")) ? "Cypress College" : "Fullerton College";
                        $("#section-details-college").text(college);
                        const title = course.crseLongTitle ? course.crseLongTitle : course.crseTitle;
                        //console.log(course.subjCode);
                        $("#section-details-title").text(course.crseSubjCode + " " + course.crseCrseNumb + ": " + title);
                        $("#section-details-crn").text(section.sectCrn);
                        $("#section-details-instructors tbody").html("");
                        
                        /*for(let k = 0; k < section.INSTRUCTORS.length; k++){

                            $("#section-details-instructors tbody").append("<tr><td>"+section.INSTRUCTORS[k].INSTRUCTOR_NAME+"</td><td><a href='mailto:"+section.INSTRUCTORS[k].INSTRUCTOR_EMAIL+"'>"+section.INSTRUCTORS[k].INSTRUCTOR_EMAIL+"</a></td></tr>");
                        }*/

                         if (section.sectInstrName)
                        {    $("#section-details-instructors tbody").append("<tr><td>"+section.sectInstrName+"</td><td><a href='"+section.sectInstrWebsite+"'>"+(section.sectInstrWebsite == null ? 'NA' : section.sectInstrWebsite.replace('mailto:', ''))+"</a></td></tr>");
                        }   
                        
                        let sectDesc;
                        if(section.sectLongText){
                            const index = section.sectLongText.indexOf('***');
                            if(index > 0){
                                sectDesc = section.sectLongText.substring(0, index);
                            }
                            else{
                                sectDesc = section.sectLongText;
                            }
                           //sectDesc = section.SECT_DESC.replace('***', '<br/><br/>');
                            //sectDesc = sectDesc.replaceAll('*', '');
                        }
                        else{
                            sectDesc = "none"
                        }
                        $("#section-details-units").text(section.sectCredHrs);
                        $("#section-details-length").text(section.sectPtrmCode);
                        $("#section-details-description").html("<p>" + sectDesc+ "</p>");
                        //$("#section-details-description").append("<p>" + course.CATALOG_DESC + "</p>");
                        
                        $("#section-details-attributes").html("");
                        
                        for(let k = 0; k < section.sectAttr.length; k++){

                            if(section.sectAttr[k].attrCode == "ZTC" || section.sectAttr[k].attrCode == "OER" || section.sectAttr[k].attrCode == "NSC"){
                                $("#section-details-attributes").append('<li class="list-group-item">'+section.sectAttr[k].attrDesc+'<span class="badge" style="max-width:70px;"><img src="/image/ztc-75.png" alt="'+section.sectAttr[k].attrDesc+'" class="img-fluid"></span></li>');
                                
                            }
                            else if(section.sectAttr[k].attrCode == "LTC"){
                                $("#section-details-attributes").append('<li class="list-group-item">Low Textbook Cost<span class="badge" style="max-width:70px;"><img src="/image/ltc.png" alt="Low Textbook Cost" class="img-fluid"></span></li>');
                            }
                            else{
                                $("#section-details-attributes").append('<li class="list-group-item">'  + section.sectAttr[k].attrDesc + '</li>');
                            }

                        }
                        $("#section-details-cohorts").html("");
                        $("#section-details-cohorts-container").hide();
                        for(let k = 0; k < section.COHORTS?.length; k ++){
                            
                            $("#section-details-cohorts").append('<li class="list-group-item">' + section.COHORTS[k].STVCHRT_DESC + '</li>');
                            $("#section-details-cohorts-container").show();
                        }

                        $("#section-details-linked-courses tbody").html("");
                        $("#section-details-linked-courses").hide();
                        for(let k = 0; k < section.XLST?.length; k++){
                            $("#section-details-linked-courses").show();
                            $("#section-details-linked-courses tbody").append('<tr><td>' + section.XLST[k].XLST_CRN + '</td><td>' + section.XLST[k].XLST_SUBJ_CODE + ' ' + section.XLST[k].XLST_crseCrseNumb + '</td><td>' + section.XLST[k].XLST_COURSE_TITLE + '</td></tr>');
                        }
                        
                
                        const bookStoreLink = getBookStoreLink(course.COLL_CODE);

                        $("#section-details-bookstore-link").html('<a href="'+ bookStoreLink +'" target="_blank" rel="noopener noreferrer">Bookstore - Textbooks and/or Materials</a>');

                    })
                
                
                }
               // const popover = new bootstrap.Popover('.popover-dismiss', {
               // trigger: 'focus'
             //   });
             //dynamic list
                const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]');
                const popoverList = [...popoverTriggerList].map(popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl, {trigger: "focus"}));

            
        }


            

            const hideInaSec = setTimeout(function(){
                $("#search-results-spinner").hide();
                        }, 300);
           // 
            
        }
         
        

        function convertStandardTime(hour, minute){
        let ampm = "AM";  
        let hourInt = parseInt(hour);
        if(hourInt > 11){
            ampm = "PM";
            if(hourInt > 12){
                hourInt = hourInt - 12;
            } 
        }
        return hourInt.toString() + ":" + minute + "" + ampm;

        
        }

        function getBookStoreLink(college){
            let cname = 'cypress';
            const url = 'https://www.bkstr.com/' + cname + 'store/home' 
            if (college == 1)
            {
                cname= 'cypress';
            }else if (college == 2)
            {
                cname='fullerton'
            }
            else{cname='noce'}
            return url;
        }
        function getRequiredMaterials(term, college, subj, crse, crn){
            if(college == 1){
                storeId = "1355";
            }
            else if (college==2){
                storeId = "1355";
            }else{storeId = "1355";}

              let linkString = "http://www.bkstr.com/webApp/discoverView?bookstore_id-1="+storeId+"&term_id-1="+term+"&div-1=&dept-1="+subj+"&course-1="+course+"&section-1=" + crn;
;
                return encodeURI(linkString);
        }

        const getArrayFromCheckboxes = function(name){
           // console.log(name);
            const arrayOut = new Array();
            $("input:checkbox[name="+name+"]:checked").each(function(){
                arrayOut.push($(this).val());
            });
            //console.log(arrayOut);
            return arrayOut;
        }
        const populateCampus = function(campuses){
            //$("#college-select").html('<option></option>');
            $("#college-select").empty();
            $("#college-select").append('<option value="ALL">All Colleges</option>');
            campuses.forEach(campus =>{
                    $("#college-select").append('<option value="'+campus.campCode+'">'+ campus.campDesc +'</option>');
                });
            $("#college-select").val("ALL");    
        }
        const populatePrtms = function(ptrms){
           //console.log("ptrm");
            //$("#ptrm-select").html('<option></option>');
            
            $("#ptrm-list").html("");
            let i = 1;
            if (ptrms)
            {
                ptrms.forEach(ptrm =>{
                    //const code = ptrm.ptrmCode;
                    //const desc = ptrm.ptrmDesc;
                    const checkBox = createCheckBox("flexRadioPTRM", ptrm.ptrmDesc, ptrm.ptrmCode, i);
                        $("#ptrm-list").append(checkBox);
                        i ++;
                });
            }
            checkBoxGroupSetup("flexRadioPTRM", "dropdownMenuButtonPTRM");
        }

        const populateSubjects = function(subjects){
            const college = $("#college-select").val();
            //console.log("Setting subjects for college: " + college);
            $("#subject-select").html('<option></option>');
            if(college == "ALL"){
                subjects.forEach(subject =>{
                    $("#subject-select").append('<option value="'+subject.subjCode+'">'+subject.subjCode + ' ' + subject.subjDesc+'</option>');
                });
            }
            else{
                subjects.forEach(subject =>{
                   // if(subject.c.includes(college)){
                    $("#subject-select").append('<option value="'+subject.subjCode+'">'+subject.subjDesc+'</option>');
                   // }
                });
            }
        }
        const populateInstructorsSelect = function(instructors){
            const college = $("#college-select").val();
            //console.log("Setting subjects ;for college " + college);

            

        }
        function jump(h){
            if(window.innerWidth < 768){
                var top = document.getElementById(h).offsetTop;
                window.scrollTo(0, top);
            }
        }
        
        function reset(){
            //reset all options except Term and College
            $("#subject-select").val("");
            $("#search_input_main").val("");
            $("[name='flexRadioInstrMethod']").prop("checked", false);
            $("#instr-method-button").text("");
            $("[name='flexRadioSessions']").prop("checked", false);
            $("#dropdownMenuButtonSessions").text("");
            $("#instructor-input").val("");
            $("#instructor-input-email").val("");
            $("[name=textbookCost]").prop("checked", false);
            $("#textbookDropDown").text("");
            $("[name=flexRadioMeetingDays]").prop("checked", false);
            $("#meetingDropdown").text("");
            $("#status-select").val("");
            $("[name=flexRadioTransfer]").prop("checked", false);
            $("#dropdownMenuButtonTransferability").text("");
            $("[name=flexRadioCSUGE]").prop("checked", false);
            $("#dropdownMenuButtonCSUGE").text("");
            $("[name=flexRadioIGETC]").prop("checked", false);
            $("#dropdownMenuButtonIGETC").text("");
            $("#search-results-container").addClass("d-none");
            $("#start-time").val(5);
            $("#end-time").val(24);
            $("#start-time-result").text(convertNumberToStandardTime(5));
            $("#end-time-result").text(convertNumberToStandardTime(24));
            $("#credit-select").val("CRNC");


        }
        $("#start-time").on("change", function(e){
            //console.log(e.target.value);
            $("#start-time-result").text(convertNumberToStandardTime(e.target.value));
            triggerSearch();
        });
        $("#end-time").on("change", function(e){
            //console.log(e.target.value);
            $("#end-time-result").text(convertNumberToStandardTime(e.target.value));
            triggerSearch();
        });
        
        $("#credit-select").on("change", function(e){
            triggerSearch();
        });        

        function convertNumberToStandardTime(timeNumber){
            //this assumes the step is 30 min
            let minutes;
            if(timeNumber % 1 == 0){
                minutes = "00";
            }
            else{
                minutes = "30";
            }
            const hoursNumber = Math.floor(timeNumber);
            let ampm = (timeNumber == 24) ? "AM" : (timeNumber >= 12) ? "PM" : "AM";
            
            let hours;
            if(hoursNumber > 12){
                hours = (hoursNumber - 12).toString();
            }
            else{
                hours = hoursNumber.toString();
            }
            if(parseInt(hours) < 10){
                hours = "0" + hours;
            }
            return hours + ":" + minutes + " " + ampm;
        }
        function convertNumberToMilitaryTime(timeNumber){
            let minutes;
            if(timeNumber % 1 == 0){
                minutes = "00";
            }
            else{
                minutes = "30";
            }
            const hoursNumber = Math.floor(timeNumber);
            let hours;
            if(hoursNumber < 10){
                hours = "0" + hoursNumber.toString();
            }
            else{
                hours = hoursNumber.toString();
            }
            return hours + minutes;
 
        }


    