'use client'
import React, { useState } from 'react'
import Card from './Card'
import MeetingModal from './MeetingModal';
import { useUser } from '@clerk/nextjs';
import { useStreamVideoClient } from '@stream-io/video-react-sdk';
import { Call } from '@stream-io/video-react-sdk';
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from 'next/navigation';
import { Textarea } from './ui/textarea';
import ReactDatePicker from 'react-datepicker';
import { Input } from './ui/input';

const MeetingTypeList = () => {
    const router = useRouter();
    const [meetingState, setMeetingState] = useState<'isScheduleMeeting' | 'isJoiningMetting' | 'isInstantMeeting' | undefined>();
    const { user } = useUser();
    const client = useStreamVideoClient();
    const { toast } = useToast();
    const [values, setValues] = useState({
        dateTime: new Date(),
        description: '',
        link: ''
    });
    const [callDetails, setCallDetails] = useState<Call>();

    const createMetting = async () => {
        if (!client) return;
        if (!user) return;

        try {
            if (!values.dateTime) {
                toast({
                    title: 'Please select date and time'
                });
                return;
            }
            const id = crypto.randomUUID();
            const call = client.call('default', id);

            if (!call) {
                throw new Error('Failed to create call');
            }
            const startsAt = values.dateTime.toISOString() || new Date(Date.now()).toISOString();
            const description = values.description || 'Instant meeting';

            await call.getOrCreate({
                data: {
                    starts_at: startsAt,
                    custom: {
                        description
                    }

                }
            })

            setCallDetails(call);

            if (!values.description) {
                router.push(`/meeting&${call.id}`);
            }
            toast({
                title: 'Metting Created',
            });
        } catch (error) {
            toast({
                title: 'Failed to create metting'
            });
            console.log("Meeting type list", error);
        }
    }
    const meetingLink = `${process.env.NEXT_PUBLIC_BASE_URL}/meeting&${callDetails?.id}`;
    return (
        <section className='grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4 '>
            <Card color="bg-orange-1" img="/icons/add-meeting.svg" title="New Meeting" description="Start an instant meeting" handleClick={() => setMeetingState('isInstantMeeting')} />

            <Card color="bg-purple-1" img="/icons/schedule.svg" title="Schedule meeting" description="Plan your meeting" handleClick={() => setMeetingState('isScheduleMeeting')} />

            <Card color="bg-blue-1" img="/icons/join-meeting.svg" title="Join Meeting" description="via invitation link" handleClick={() => setMeetingState('isJoiningMetting')} />


            <Card color="bg-yellow-1" img="/icons/recordings.svg" title="View Recordings" description="Check out your recordings" handleClick={() => router.push('/recordings')
            } />

            {!callDetails ? (
                <MeetingModal
                    isOpen={meetingState === 'isScheduleMeeting'}
                    onClose={() => setMeetingState(undefined)}
                    title="Create meeting"
                    handleClick={createMetting}
                > <div className='flex flex-col gap-2.5'>
                        <label className='text-base text-normal leading-[22px] text-sky-2'>Add a description</label>
                        <Textarea className='border-none bg-dark-3 focus-visible:ring-0 focus-visible-ring-offset-0' onChange={(e) => { setValues({ ...values, description: e.target.value }) }} />
                    </div>
                    <div className='flex w-full flex-col gap-2.5'>
                        <label className='text-base text-normal leading-[22px] text-sky-2'>Select date and Time</label>
                        <ReactDatePicker selected={values.dateTime} onChange={(date) => {
                            setValues({ ...values, dateTime: date! })
                        }} showTimeSelect timeFormat='HH:MM' timeIntervals={15} timeCaption='time' dateFormat="MMMM d, yyyy h:mm aa"
                            className='w-full rounded bg-dark-3 p-2 focus:outline-none'
                        />
                    </div>
                </MeetingModal>
            ) : (
                <MeetingModal
                    isOpen={meetingState === 'isScheduleMeeting'}
                    onClose={() => setMeetingState(undefined)}
                    title="Meeting Created"
                    className="text-center"
                    handleClick={() => {
                        navigator.clipboard.writeText(meetingLink);
                        toast({
                            title: 'Link Copied'
                        })
                    }}
                    image='/icons/checked.svg'
                    buttonIcon='/icons/copy.svg'
                    buttonText="Copy Meeting Link"
                />
            )}
            <MeetingModal
                isOpen={meetingState === 'isInstantMeeting'}
                onClose={() => setMeetingState(undefined)}
                title="Start an Instant Meeting"
                className="text-center"
                buttonText="Start-Meeting"
                handleClick={createMetting}
            />

            <MeetingModal
                isOpen={meetingState === 'isJoiningMetting'}
                onClose={() => setMeetingState(undefined)}
                title="Enter the meeting link"
                className="text-center"
                buttonText="Join-Meeting"
                handleClick={() => router.push(values.link)}
            >
                <Input className='border-none bg-dark-3 focus-visible:ring-0 focus-visible:ring-offset-0' placeholder='Meeting Link' onChange={(e) => {setValues({...values, link: e.target.value})}}/>
            </MeetingModal>
        </section>
    )
}

export default MeetingTypeList
