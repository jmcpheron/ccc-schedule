//This includesAll function to check if every value in arr2 is included in arr1 using the includes method. It returns true only if all values from arr2 are found within arr1, and false otherwise.
function includesAll(arr1, arr2) {return arr2.every(value => arr1.includes(value));}
function meetDaystoArray(sectMeetings)
{
    if (Array.isArray(sectMeetings))
    {
        const mArry = [];
        for(let i = 0; i < sectMeetings.length; i++)
        {   let meetObj = ''; 
            if(meeting.monDay) meetObj += 'M';
            if(meeting.tueDay) meetObj += '-T';
            if(meeting.wedDay) meetObj += '-W';
            if(meeting.thuDay) meetObj += '-R';
            if(meeting.friDay) meetObj += '-F';
            if(meeting.satDay) meetObj += '-S';
            if(meeting.sunDay) meetObj += '-U';
            mArry[i]=meetObj;
        }
    }
    return mArry;
}