import { useCallback, useState } from 'react';
import { ScreenHeader } from '@components/ScreenHeader';
import { HistoryCard } from '@components/HistoryCard';
import { Heading, VStack, SectionList, Text, useToast, Center} from 'native-base';
import { AppError } from '@utils/AppError';
import { api } from '@services/api';
import { useFocusEffect } from '@react-navigation/native';
import { HistoryByDayDTO } from '@dtos/HistoryByDayDTO';
import { Loading } from '@components/Loading';
import { useAuth } from '@hooks/useAuth';

export function History(){
    const toast = useToast();
    const { refreshedToken } = useAuth()
    const [isLoading, setIsLoading] = useState(true);
    const [exercises, setExercises] = useState<HistoryByDayDTO[]>([]);

    async function fatcHistory() {
        try {
            setIsLoading(true);
            const response = await api.get('/history');
            setExercises(response.data);
        } catch (error) {
            const isAppError = error instanceof AppError;
            const title = isAppError ? error.message : 'Não foi posivel carregar o historico.';
            toast.show({
                title,
                placement: 'top',
                bgColor: 'red.500'
            })
        } finally {
            setIsLoading(false);
        }
    }

    useFocusEffect(useCallback(()=>{fatcHistory();},[refreshedToken]))
    return (
        <VStack flex={1}>
            <ScreenHeader title="Histórico de Exercícios"/>
            

            {
                isLoading ? <Loading/> : (
                    exercises?.length > 0 ?
                    <SectionList 
                    sections={exercises}
                    keyExtractor={item => item.id}
                    renderItem={({item}) => (<HistoryCard data={item} />)}
                    
                    renderSectionHeader={({ section }) => (
                        <Heading color="gray.200" fontSize="md" mt={10} mb={3} fontFamily="heading">
                            {section.title
                            }

                        </Heading>
                    )}
                    px={8}
                    contentContainerStyle={exercises.length === 0 && {flex: 1, justifyContent: 'center'}}
                    
                    showsHorizontalScrollIndicator={false}
                    />
                    :
                    <Center flex={1}>
                        <Text color="gray.100" textAlign="center">
                            Não há exercícios registrados ainda. {'\n'}
                            Vamos fazer exercícios hoje?
                        </Text>
                    </Center>
                ) 
                
            }

        </VStack>
    );
}